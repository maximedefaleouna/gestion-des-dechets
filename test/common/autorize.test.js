const jwt = require("jsonwebtoken");

const mockUserModel = {
  findById: jest.fn(),
};

jest.mock("../../src/modules/users/user.model", () => mockUserModel);

const { authenticateToken, authorizeRoles, ROLES } = require("../../src/common/utils/autorize");

const ACCESS_TOKEN_SECRET = "dev-access-secret";

describe("autorize utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authenticateToken", () => {
    it("rejects missing headers", async () => {
      const req = { headers: {} };
      const res = {};
      const next = jest.fn();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Token d'acces manquant ou invalide",
          statusCode: 401,
        }),
      );
    });

    it("rejects invalid authorization schemes", async () => {
      const req = { headers: { authorization: "Basic token" } };
      const res = {};
      const next = jest.fn();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Token d'acces manquant ou invalide",
          statusCode: 401,
        }),
      );
    });

    it("rejects inactive users", async () => {
      const token = jwt.sign({ sub: "user-1" }, ACCESS_TOKEN_SECRET);
      const user = {
        _id: "user-1",
        email: "agent@example.com",
        role: ROLES.AGENT,
        isActive: false,
      };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = jest.fn();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Ce compte est desactive",
          statusCode: 403,
        }),
      );
    });

    it("rejects missing users", async () => {
      const token = jwt.sign({ sub: "user-1" }, ACCESS_TOKEN_SECRET);

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = jest.fn();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Utilisateur introuvable",
          statusCode: 401,
        }),
      );
    });

    it("falls back to a generic access token error when verification throws", async () => {
      const token = jwt.sign({ sub: "user-1" }, ACCESS_TOKEN_SECRET);
      const verifySpy = jest.spyOn(jwt, "verify").mockImplementation(() => {
        throw new Error("unexpected");
      });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = jest.fn();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Token d'acces invalide ou expire",
          statusCode: 401,
        }),
      );

      verifySpy.mockRestore();
    });

    it("sets req.user for valid tokens", async () => {
      const token = jwt.sign({ sub: "user-1" }, ACCESS_TOKEN_SECRET);
      const user = {
        _id: "user-1",
        email: "agent@example.com",
        role: ROLES.AGENT,
        isActive: true,
      };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = jest.fn();

      await authenticateToken(req, res, next);

      expect(req.user).toEqual({
        id: "user-1",
        email: "agent@example.com",
        role: ROLES.AGENT,
      });
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("authorizeRoles", () => {
    it("rejects unauthenticated requests", () => {
      const next = jest.fn();

      authorizeRoles(ROLES.ADMIN)({}, {}, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Utilisateur non authentifie",
          statusCode: 401,
        }),
      );
    });

    it("allows super admins", () => {
      const next = jest.fn();

      authorizeRoles(ROLES.ADMIN)({ user: { role: ROLES.SUPER_ADMIN } }, {}, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("rejects forbidden roles", () => {
      const next = jest.fn();

      authorizeRoles(ROLES.ADMIN)({ user: { role: ROLES.AGENT } }, {}, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vous n'avez pas l'autorisation pour cette action",
          statusCode: 403,
        }),
      );
    });
  });
});
