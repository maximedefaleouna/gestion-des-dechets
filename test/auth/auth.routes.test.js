let mockCurrentUser = {
  id: "user-1",
  email: "jane.doe@example.com",
  role: "ADMIN",
  isActive: true,
};

jest.mock("../../src/common/utils/autorize", () => {
  const actual = jest.requireActual("../../src/common/utils/autorize");

  return {
    ...actual,
    authenticateToken: (req, res, next) => {
      req.user = mockCurrentUser;
      next();
    },
  };
});

jest.mock("../../src/modules/auth/auth.service");

const request = require("supertest");
const app = require("../../src/app");
const authService = require("../../src/modules/auth/auth.service");

describe("Auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: "user-1",
      email: "jane.doe@example.com",
      role: "ADMIN",
      isActive: true,
    };
  });

  describe("POST /api/v1/auth/login", () => {
    it("returns the authenticated user and tokens", async () => {
      const payload = {
        user: {
          id: "user-1",
          nom: "Doe",
          prenom: "Jane",
          email: "jane.doe@example.com",
          role: "ADMIN",
          isActive: true,
          createdBy: null,
          createdAt: "2026-04-09T00:00:00.000Z",
          updatedAt: "2026-04-09T00:00:00.000Z",
        },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      authService.login.mockResolvedValue(payload);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "jane.doe@example.com", password: "secret123" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Connexion reussie",
        data: payload,
      });
      expect(authService.login).toHaveBeenCalledWith({
        email: "jane.doe@example.com",
        password: "secret123",
      });
    });

    it("returns the service error status when login fails", async () => {
      const error = Object.assign(new Error("Identifiants invalides"), {
        statusCode: 401,
      });

      authService.login.mockRejectedValue(error);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "jane.doe@example.com", password: "wrong-password" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Identifiants invalides",
      });
    });

    it("returns a 500 for unexpected service errors", async () => {
      authService.login.mockRejectedValue(new Error("Unexpected failure"));

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "jane.doe@example.com", password: "wrong-password" });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: "Une erreur est survenue",
      });
    });

    it("uses the fallback message when the error message is empty", async () => {
      const error = new Error("");
      error.statusCode = 400;
      authService.login.mockRejectedValue(error);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "jane.doe@example.com", password: "wrong-password" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Une erreur est survenue",
      });
    });
  });

  describe("POST /api/v1/auth/refresh-token", () => {
    it("returns refreshed tokens", async () => {
      const payload = {
        user: {
          id: "user-1",
          nom: "Doe",
          prenom: "Jane",
          email: "jane.doe@example.com",
          role: "ADMIN",
          isActive: true,
          createdBy: null,
          createdAt: "2026-04-09T00:00:00.000Z",
          updatedAt: "2026-04-09T00:00:00.000Z",
        },
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };

      authService.refreshUserToken.mockResolvedValue(payload);

      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({ refreshToken: "old-refresh-token" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Token rafraichi",
        data: payload,
      });
      expect(authService.refreshUserToken).toHaveBeenCalledWith({
        refreshToken: "old-refresh-token",
      });
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("logs out the current session", async () => {
      authService.logout.mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .send({ refreshToken: "old-refresh-token" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Deconnexion reussie",
      });
      expect(authService.logout).toHaveBeenCalledWith({
        refreshToken: "old-refresh-token",
      });
    });
  });

  describe("POST /api/v1/auth/change-password", () => {
    it("changes the password for the authenticated user", async () => {
      const payload = { message: "Mot de passe modifie avec succes" };

      authService.changePassword.mockResolvedValue(payload);

      const response = await request(app)
        .post("/api/v1/auth/change-password")
        .send({
          currentPassword: "old-secret",
          newPassword: "new-secret",
          confirmNewPassword: "new-secret",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(payload);
      expect(authService.changePassword).toHaveBeenCalledWith(
        mockCurrentUser,
        {
          currentPassword: "old-secret",
          newPassword: "new-secret",
          confirmNewPassword: "new-secret",
        },
      );
    });
  });

  describe("POST /api/v1/auth/forgot-password/request", () => {
    it("requests a reset code for the email address", async () => {
      const payload = {
        message: "Si un compte existe avec cet email, un code de verification a ete genere",
        data: {
          email: "jane.doe@example.com",
          expiresAt: "2026-04-12T12:00:00.000Z",
          verificationCode: "123456",
        },
      };

      authService.requestPasswordReset.mockResolvedValue(payload);

      const response = await request(app)
        .post("/api/v1/auth/forgot-password/request")
        .send({ email: "jane.doe@example.com" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(payload);
      expect(authService.requestPasswordReset).toHaveBeenCalledWith({
        email: "jane.doe@example.com",
      });
    });
  });

  describe("POST /api/v1/auth/forgot-password/verify", () => {
    it("verifies the reset code and returns a reset token", async () => {
      const payload = {
        message: "Code de verification valide",
        data: {
          email: "jane.doe@example.com",
          resetToken: "reset-token",
          expiresAt: "2026-04-12T12:15:00.000Z",
        },
      };

      authService.verifyPasswordResetCode.mockResolvedValue(payload);

      const response = await request(app)
        .post("/api/v1/auth/forgot-password/verify")
        .send({
          email: "jane.doe@example.com",
          code: "123456",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(payload);
      expect(authService.verifyPasswordResetCode).toHaveBeenCalledWith({
        email: "jane.doe@example.com",
        code: "123456",
      });
    });
  });

  describe("POST /api/v1/auth/forgot-password/reset", () => {
    it("resets the password after verification", async () => {
      const payload = { message: "Mot de passe reinitialise avec succes" };

      authService.resetPassword.mockResolvedValue(payload);

      const response = await request(app)
        .post("/api/v1/auth/forgot-password/reset")
        .send({
          email: "jane.doe@example.com",
          resetToken: "reset-token",
          newPassword: "new-secret",
          confirmNewPassword: "new-secret",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(payload);
      expect(authService.resetPassword).toHaveBeenCalledWith({
        email: "jane.doe@example.com",
        resetToken: "reset-token",
        newPassword: "new-secret",
        confirmNewPassword: "new-secret",
      });
    });
  });
});
