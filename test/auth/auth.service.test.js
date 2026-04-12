const jwt = require("jsonwebtoken");

const mockUserModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const mockPasswordResetCodeModel = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock("../../src/modules/users/user.model", () => mockUserModel);
jest.mock(
  "../../src/modules/auth/auth.model",
  () => mockPasswordResetCodeModel,
);
jest.mock("../../src/common/utils/logger", () => mockLogger);

const authService = require("../../src/modules/auth/auth.service");
const crypto = require("crypto");

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
    delete process.env.NODE_ENV;
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

  describe("changePassword", () => {
    it("rejects missing fields", async () => {
      await expect(
        authService.changePassword({ id: "user-1" }, { currentPassword: "old" }),
      ).rejects.toMatchObject({
        message:
          "Ancien mot de passe, nouveau mot de passe et confirmation sont obligatoires",
        statusCode: 400,
      });
    });

    it("rejects password confirmation mismatches", async () => {
      await expect(
        authService.changePassword(
          { id: "user-1" },
          {
            currentPassword: "old",
            newPassword: "new-1",
            confirmNewPassword: "new-2",
          },
        ),
      ).rejects.toMatchObject({
        message: "La confirmation du nouveau mot de passe ne correspond pas",
        statusCode: 400,
      });
    });

    it("rejects unknown users", async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.changePassword(
          { id: "user-1" },
          {
            currentPassword: "old",
            newPassword: "new-pass",
            confirmNewPassword: "new-pass",
          },
        ),
      ).rejects.toMatchObject({
        message: "Utilisateur introuvable",
        statusCode: 404,
      });
    });

    it("rejects a wrong current password", async () => {
      const user = createUserDoc();
      user.comparePassword.mockResolvedValue(false);
      mockUserModel.findById.mockReturnValue(user);

      await expect(
        authService.changePassword(
          { id: "user-1" },
          {
            currentPassword: "wrong-old",
            newPassword: "new-pass",
            confirmNewPassword: "new-pass",
          },
        ),
      ).rejects.toMatchObject({
        message: "Ancien mot de passe incorrect",
        statusCode: 400,
      });
    });

    it("updates the password and clears the session on success", async () => {
      const user = createUserDoc();
      user.comparePassword.mockResolvedValue(true);
      mockUserModel.findById.mockReturnValue(user);

      const result = await authService.changePassword(
        { id: "user-1" },
        {
          currentPassword: "old-pass",
          newPassword: "new-pass",
          confirmNewPassword: "new-pass",
        },
      );

      expect(result).toEqual({
        message: "Mot de passe modifie avec succes",
      });
      expect(user.password).toBe("new-pass");
      expect(user.refreshToken).toBeNull();
      expect(user.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("requestPasswordReset", () => {
    it("rejects missing emails", async () => {
      await expect(authService.requestPasswordReset({})).rejects.toMatchObject({
        message: "L'email est obligatoire",
        statusCode: 400,
      });
    });

    it("returns a neutral response when the email does not exist", async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await authService.requestPasswordReset({
        email: "missing@example.com",
      });

      expect(result).toEqual({
        message:
          "Si un compte existe avec cet email, un code de verification a ete genere",
        data: {
          email: "missing@example.com",
          expiresAt: null,
          verificationCode: null,
        },
      });
      expect(mockPasswordResetCodeModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("hides the verification code in production", async () => {
      const user = createUserDoc();
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      mockUserModel.findOne.mockResolvedValue(user);
      mockPasswordResetCodeModel.findOneAndUpdate.mockResolvedValue({});

      try {
        const result = await authService.requestPasswordReset({
          email: "jane.doe@example.com",
        });

        expect(result.data.email).toBe("jane.doe@example.com");
        expect(result.data.verificationCode).toBeNull();
        expect(mockLogger.info).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = previousNodeEnv;
      }
    });

    it("creates a verification code for an active account", async () => {
      const user = createUserDoc();
      mockUserModel.findOne.mockResolvedValue(user);
      mockPasswordResetCodeModel.findOneAndUpdate.mockResolvedValue({});

      const result = await authService.requestPasswordReset({
        email: "jane.doe@example.com",
      });

      expect(result.message).toBe(
        "Si un compte existe avec cet email, un code de verification a ete genere",
      );
      expect(result.data.email).toBe("jane.doe@example.com");
      expect(result.data.expiresAt).toEqual(expect.any(String));
      expect(result.data.verificationCode).toEqual(expect.any(String));
      expect(result.data.verificationCode).toHaveLength(6);
      expect(mockPasswordResetCodeModel.findOneAndUpdate).toHaveBeenCalledWith(
        { user: user._id },
        expect.objectContaining({
          $set: expect.objectContaining({
            user: user._id,
            email: "jane.doe@example.com",
            codeHash: expect.any(String),
            codeAttempts: 0,
            verifiedAt: null,
            resetTokenHash: null,
            resetTokenExpiresAt: null,
            usedAt: null,
          }),
        }),
        expect.objectContaining({
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }),
      );
    });
  });

  describe("verifyPasswordResetCode", () => {
    it("rejects invalid payloads", async () => {
      await expect(authService.verifyPasswordResetCode({ email: "a@example.com" })).rejects
        .toMatchObject({
          message: "L'email et le code de verification sont obligatoires",
          statusCode: 400,
        });
    });

    it("rejects malformed codes", async () => {
      await expect(
        authService.verifyPasswordResetCode({
          email: "a@example.com",
          code: "12",
        }),
      ).rejects.toMatchObject({
        message: "Le code de verification doit contenir 6 chiffres",
        statusCode: 400,
      });
    });

    it("rejects unknown verification sessions", async () => {
      mockPasswordResetCodeModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.verifyPasswordResetCode({
          email: "a@example.com",
          code: "123456",
        }),
      ).rejects.toMatchObject({
        message: "Code de verification invalide ou expire",
        statusCode: 400,
      });
    });

    it("rejects expired verification codes", async () => {
      const entry = {
        email: "a@example.com",
        codeHash: crypto.createHash("sha256").update("123456").digest("hex"),
        codeExpiresAt: new Date(Date.now() - 1000),
        codeAttempts: 0,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockPasswordResetCodeModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(entry),
      });

      await expect(
        authService.verifyPasswordResetCode({
          email: "a@example.com",
          code: "123456",
        }),
      ).rejects.toMatchObject({
        message: "Code de verification invalide ou expire",
        statusCode: 400,
      });
    });

    it("rejects blocked verification sessions", async () => {
      const entry = {
        email: "a@example.com",
        codeHash: crypto.createHash("sha256").update("123456").digest("hex"),
        codeExpiresAt: new Date(Date.now() + 1000),
        codeAttempts: 5,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockPasswordResetCodeModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(entry),
      });

      await expect(
        authService.verifyPasswordResetCode({
          email: "a@example.com",
          code: "123456",
        }),
      ).rejects.toMatchObject({
        message: "Code de verification bloque. Veuillez redemander un code",
        statusCode: 400,
      });
    });

    it("rejects invalid codes and increments attempts", async () => {
      const entry = {
        email: "a@example.com",
        codeHash: crypto.createHash("sha256").update("999999").digest("hex"),
        codeExpiresAt: new Date(Date.now() + 1000),
        codeAttempts: 1,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockPasswordResetCodeModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(entry),
      });

      await expect(
        authService.verifyPasswordResetCode({
          email: "a@example.com",
          code: "123456",
        }),
      ).rejects.toMatchObject({
        message: "Code de verification invalide",
        statusCode: 400,
      });
      expect(entry.codeAttempts).toBe(2);
      expect(entry.save).toHaveBeenCalledTimes(1);
    });

    it("returns a reset token on success", async () => {
      const entry = {
        email: "a@example.com",
        codeHash: crypto.createHash("sha256").update("123456").digest("hex"),
        codeExpiresAt: new Date(Date.now() + 1000),
        codeAttempts: 0,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockPasswordResetCodeModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(entry),
      });

      const result = await authService.verifyPasswordResetCode({
        email: "a@example.com",
        code: "123456",
      });

      expect(result.message).toBe("Code de verification valide");
      expect(result.data.email).toBe("a@example.com");
      expect(result.data.resetToken).toEqual(expect.any(String));
      expect(result.data.expiresAt).toEqual(expect.any(String));
      expect(entry.resetTokenHash).toEqual(expect.any(String));
      expect(entry.verifiedAt).toEqual(expect.any(Date));
      expect(entry.codeAttempts).toBe(0);
      expect(entry.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("resetPassword", () => {
    it("rejects incomplete payloads", async () => {
      await expect(authService.resetPassword({ email: "a@example.com" })).rejects.toMatchObject(
        {
          message:
            "L'email, le token de reinitialisation, le nouveau mot de passe et sa confirmation sont obligatoires",
          statusCode: 400,
        },
      );
    });

    it("rejects mismatched confirmation", async () => {
      await expect(
        authService.resetPassword({
          email: "a@example.com",
          resetToken: "token",
          newPassword: "new-pass",
          confirmNewPassword: "other-pass",
        }),
      ).rejects.toMatchObject({
        message: "La confirmation du nouveau mot de passe ne correspond pas",
        statusCode: 400,
      });
    });

    it("rejects invalid sessions", async () => {
      mockPasswordResetCodeModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.resetPassword({
          email: "a@example.com",
          resetToken: "token",
          newPassword: "new-pass",
          confirmNewPassword: "new-pass",
        }),
      ).rejects.toMatchObject({
        message: "Session de reinitialisation invalide ou expiree",
        statusCode: 400,
      });
    });

    it("rejects expired reset sessions", async () => {
      const entry = {
        email: "a@example.com",
        user: "user-1",
        resetTokenHash: crypto.createHash("sha256").update("token").digest("hex"),
        resetTokenExpiresAt: new Date(Date.now() - 1000),
        verifiedAt: new Date(),
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockPasswordResetCodeModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(entry),
      });

      await expect(
        authService.resetPassword({
          email: "a@example.com",
          resetToken: "token",
          newPassword: "new-pass",
          confirmNewPassword: "new-pass",
        }),
      ).rejects.toMatchObject({
        message: "Session de reinitialisation invalide ou expiree",
        statusCode: 400,
      });
    });

    it("rejects reset tokens that do not match the session", async () => {
      const entry = {
        email: "a@example.com",
        user: "user-1",
        resetTokenHash: crypto.createHash("sha256").update("other-token").digest("hex"),
        resetTokenExpiresAt: new Date(Date.now() + 1000),
        verifiedAt: new Date(),
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockPasswordResetCodeModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(entry),
      });

      await expect(
        authService.resetPassword({
          email: "a@example.com",
          resetToken: "token",
          newPassword: "new-pass",
          confirmNewPassword: "new-pass",
        }),
      ).rejects.toMatchObject({
        message: "Session de reinitialisation invalide ou expiree",
        statusCode: 400,
      });
    });

    it("rejects when verification has not happened yet", async () => {
      const entry = {
        email: "a@example.com",
        user: "user-1",
        resetTokenHash: crypto.createHash("sha256").update("token").digest("hex"),
        resetTokenExpiresAt: new Date(Date.now() + 1000),
        verifiedAt: null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockPasswordResetCodeModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(entry),
      });

      await expect(
        authService.resetPassword({
          email: "a@example.com",
          resetToken: "token",
          newPassword: "new-pass",
          confirmNewPassword: "new-pass",
        }),
      ).rejects.toMatchObject({
        message: "Veuillez d'abord verifier le code de verification",
        statusCode: 400,
      });
    });

    it("rejects missing users after a valid reset session", async () => {
      const entry = {
        email: "a@example.com",
        user: "user-1",
        resetTokenHash: crypto.createHash("sha256").update("token").digest("hex"),
        resetTokenExpiresAt: new Date(Date.now() + 1000),
        verifiedAt: new Date(),
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockPasswordResetCodeModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(entry),
      });
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.resetPassword({
          email: "a@example.com",
          resetToken: "token",
          newPassword: "new-pass",
          confirmNewPassword: "new-pass",
        }),
      ).rejects.toMatchObject({
        message: "Utilisateur introuvable",
        statusCode: 404,
      });
    });

    it("resets the password on success", async () => {
      const entry = {
        email: "a@example.com",
        user: "user-1",
        resetTokenHash: crypto.createHash("sha256").update("token").digest("hex"),
        resetTokenExpiresAt: new Date(Date.now() + 1000),
        verifiedAt: new Date(),
        usedAt: null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      const user = createUserDoc({ email: "a@example.com" });
      mockPasswordResetCodeModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(entry),
      });
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      const result = await authService.resetPassword({
        email: "a@example.com",
        resetToken: "token",
        newPassword: "new-pass",
        confirmNewPassword: "new-pass",
      });

      expect(result).toEqual({
        message: "Mot de passe reinitialise avec succes",
      });
      expect(user.password).toBe("new-pass");
      expect(user.refreshToken).toBeNull();
      expect(entry.usedAt).toEqual(expect.any(Date));
      expect(entry.resetTokenHash).toBeNull();
      expect(user.save).toHaveBeenCalledTimes(1);
      expect(entry.save).toHaveBeenCalledTimes(1);
    });
  });
});
