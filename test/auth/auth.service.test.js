const jwt = require("jsonwebtoken");

const mockUserModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock("../../src/modules/users/user.model", () => mockUserModel);
jest.mock("../../src/common/utils/logger", () => mockLogger);

const authService = require("../../src/modules/auth/auth.service");

const REFRESH_TOKEN_SECRET = "dev-refresh-secret";

const createUserDoc = (overrides = {}) => {
  const doc = {
    _id: "user-1",
    nom: "Doe",
    prenom: "Jane",
    email: "jane.doe@example.com",
    role: "ADMIN",
    isActive: true,
    createdBy: null,
    createdAt: new Date("2026-04-09T00:00:00.000Z"),
    updatedAt: new Date("2026-04-09T00:00:00.000Z"),
    refreshToken: null,
    comparePassword: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    ...overrides,
  };

  return doc;
};

describe("auth.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("bootstrapSuperAdmin", () => {
    it("returns the existing super admin when one already exists", async () => {
      const existing = createUserDoc({ role: "SUPER_ADMIN" });
      mockUserModel.findOne.mockResolvedValue(existing);

      const result = await authService.bootstrapSuperAdmin();

      expect(result).toBe(existing);
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it("creates the default super admin when none exists", async () => {
      const created = createUserDoc({
        role: "SUPER_ADMIN",
        email: "superadmin@recycletrack.local",
        nom: "Super",
        prenom: "Admin",
      });
      const previousJwtSecret = process.env.JWT_SECRET;
      const previousRefreshSecret = process.env.JWT_REFRESH_SECRET;
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      try {
        mockUserModel.findOne.mockResolvedValue(null);
        mockUserModel.create.mockResolvedValue(created);

        const result = await authService.bootstrapSuperAdmin();

        expect(result).toBe(created);
        expect(mockLogger.warn).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith(
          "Bootstrap SUPER_ADMIN created with email superadmin@recycletrack.local",
        );
        expect(mockUserModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            nom: "Super",
            prenom: "Admin",
            email: "superadmin@recycletrack.local",
            password: "SuperAdmin123!",
            role: "SUPER_ADMIN",
            createdBy: null,
          }),
        );
      } finally {
        process.env.JWT_SECRET = previousJwtSecret;
        process.env.JWT_REFRESH_SECRET = previousRefreshSecret;
      }
    });
  });

  describe("login", () => {
    it("rejects missing credentials", async () => {
      await expect(authService.login({ email: "a@example.com" })).rejects.toMatchObject(
        {
          message: "Email et mot de passe sont obligatoires",
          statusCode: 400,
        },
      );
    });

    it("rejects unknown users", async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.login({ email: "a@example.com", password: "secret" }),
      ).rejects.toMatchObject({
        message: "Identifiants invalides",
        statusCode: 401,
      });
    });

    it("rejects inactive accounts", async () => {
      const user = createUserDoc({ isActive: false });
      mockUserModel.findOne.mockReturnValue(user);

      await expect(
        authService.login({ email: "a@example.com", password: "secret" }),
      ).rejects.toMatchObject({
        message: "Ce compte est desactive",
        statusCode: 403,
      });
    });

    it("rejects wrong passwords", async () => {
      const user = createUserDoc();
      user.comparePassword.mockResolvedValue(false);
      mockUserModel.findOne.mockReturnValue(user);

      await expect(
        authService.login({ email: "a@example.com", password: "wrong" }),
      ).rejects.toMatchObject({
        message: "Identifiants invalides",
        statusCode: 401,
      });
    });

    it("returns tokens and a sanitized user on success", async () => {
      const user = createUserDoc({
        createdBy: "creator-1",
      });
      user.comparePassword.mockResolvedValue(true);
      mockUserModel.findOne.mockReturnValue(user);

      const result = await authService.login({
        email: "Jane.DOE@example.com",
        password: "secret",
      });

      expect(result.user).toMatchObject({
        id: "user-1",
        email: "jane.doe@example.com",
        createdBy: {
          id: "creator-1",
        },
      });
      expect(typeof result.accessToken).toBe("string");
      expect(typeof result.refreshToken).toBe("string");
      expect(user.save).toHaveBeenCalledTimes(1);
      expect(user.populate).toHaveBeenCalledWith("createdBy", "nom prenom email role");
    });

    it("sanitizes a user with a populated creator object", async () => {
      const user = createUserDoc({
        createdBy: {
          _id: "creator-1",
          nom: "Admin",
          prenom: "User",
          email: "admin@example.com",
          role: "ADMIN",
        },
      });
      user.comparePassword.mockResolvedValue(true);
      mockUserModel.findOne.mockReturnValue(user);

      const result = await authService.login({
        email: "jane.doe@example.com",
        password: "secret",
      });

      expect(result.user.createdBy).toEqual({
        id: "creator-1",
        nom: "Admin",
        prenom: "User",
        email: "admin@example.com",
        role: "ADMIN",
      });
    });

    it("sanitizes a user with no creator", async () => {
      const user = createUserDoc({ createdBy: null });
      user.comparePassword.mockResolvedValue(true);
      mockUserModel.findOne.mockReturnValue(user);

      const result = await authService.login({
        email: "jane.doe@example.com",
        password: "secret",
      });

      expect(result.user.createdBy).toBeNull();
    });
  });

  describe("refreshUserToken", () => {
    it("rejects missing refresh tokens", async () => {
      await expect(authService.refreshUserToken({})).rejects.toMatchObject({
        message: "Le refresh token est obligatoire",
        statusCode: 400,
      });
    });

    it("rejects invalid refresh tokens", async () => {
      await expect(
        authService.refreshUserToken({ refreshToken: "bad-token" }),
      ).rejects.toMatchObject({
        message: "Refresh token invalide ou expire",
        statusCode: 401,
      });
    });

    it("rejects invalid sessions", async () => {
      const token = jwt.sign({ sub: "user-1", type: "refresh" }, REFRESH_TOKEN_SECRET);
      const user = createUserDoc({ refreshToken: "different-token" });
      mockUserModel.findById.mockReturnValue(user);

      await expect(
        authService.refreshUserToken({ refreshToken: token }),
      ).rejects.toMatchObject({
        message: "Session invalide",
        statusCode: 401,
      });
    });

    it("rejects inactive accounts", async () => {
      const token = jwt.sign({ sub: "user-1", type: "refresh" }, REFRESH_TOKEN_SECRET);
      const user = createUserDoc({ refreshToken: token, isActive: false });
      mockUserModel.findById.mockReturnValue(user);

      await expect(
        authService.refreshUserToken({ refreshToken: token }),
      ).rejects.toMatchObject({
        message: "Ce compte est desactive",
        statusCode: 403,
      });
    });

    it("returns fresh tokens on success", async () => {
      const token = jwt.sign({ sub: "user-1", type: "refresh" }, REFRESH_TOKEN_SECRET);
      const user = createUserDoc({ refreshToken: token });
      mockUserModel.findById.mockReturnValue(user);

      const result = await authService.refreshUserToken({ refreshToken: token });

      expect(result.user.id).toBe("user-1");
      expect(typeof result.accessToken).toBe("string");
      expect(typeof result.refreshToken).toBe("string");
      expect(user.save).toHaveBeenCalledTimes(1);
      expect(user.populate).toHaveBeenCalledWith("createdBy", "nom prenom email role");
    });
  });

  describe("logout", () => {
    it("rejects missing refresh tokens", async () => {
      await expect(authService.logout({})).rejects.toMatchObject({
        message: "Le refresh token est obligatoire",
        statusCode: 400,
      });
    });

    it("rejects invalid sessions", async () => {
      const token = jwt.sign({ sub: "user-1", type: "refresh" }, REFRESH_TOKEN_SECRET);
      const user = createUserDoc({ refreshToken: "other-token" });
      mockUserModel.findById.mockReturnValue(user);

      await expect(authService.logout({ refreshToken: token })).rejects.toMatchObject({
        message: "Session invalide",
        statusCode: 401,
      });
    });

    it("rejects invalid refresh tokens", async () => {
      await expect(
        authService.logout({ refreshToken: "bad-token" }),
      ).rejects.toMatchObject({
        message: "Refresh token invalide ou expire",
        statusCode: 401,
      });
    });

    it("rejects inactive accounts", async () => {
      const token = jwt.sign({ sub: "user-1", type: "refresh" }, REFRESH_TOKEN_SECRET);
      const user = createUserDoc({ refreshToken: token, isActive: false });
      mockUserModel.findById.mockReturnValue(user);

      await expect(authService.logout({ refreshToken: token })).rejects.toMatchObject({
        message: "Ce compte est desactive",
        statusCode: 403,
      });
    });

    it("clears the refresh token on success", async () => {
      const token = jwt.sign({ sub: "user-1", type: "refresh" }, REFRESH_TOKEN_SECRET);
      const user = createUserDoc({ refreshToken: token });
      mockUserModel.findById.mockReturnValue(user);

      await expect(authService.logout({ refreshToken: token })).resolves.toBeUndefined();

      expect(user.refreshToken).toBeNull();
      expect(user.save).toHaveBeenCalledTimes(1);
    });
  });
});
