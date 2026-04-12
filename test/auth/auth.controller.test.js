const mockAuthService = {
  login: jest.fn(),
  refreshUserToken: jest.fn(),
  logout: jest.fn(),
  changePassword: jest.fn(),
  requestPasswordReset: jest.fn(),
  verifyPasswordResetCode: jest.fn(),
  resetPassword: jest.fn(),
};

jest.mock("../../src/modules/auth/auth.service", () => mockAuthService);

const authController = require("../../src/modules/auth/auth.controller");

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("auth.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles login success", async () => {
    const req = { body: { email: "a@example.com", password: "secret" } };
    const res = createRes();
    const next = jest.fn();
    const payload = { user: { id: "u1" }, accessToken: "a", refreshToken: "r" };

    mockAuthService.login.mockResolvedValue(payload);

    await authController.login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Connexion reussie",
      data: payload,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards login errors", async () => {
    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockAuthService.login.mockRejectedValue(error);

    await authController.login(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("handles refresh success", async () => {
    const req = { body: { refreshToken: "token" } };
    const res = createRes();
    const next = jest.fn();
    const payload = { user: { id: "u1" }, accessToken: "a", refreshToken: "r" };

    mockAuthService.refreshUserToken.mockResolvedValue(payload);

    await authController.refreshToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Token rafraichi",
      data: payload,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards refresh errors", async () => {
    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockAuthService.refreshUserToken.mockRejectedValue(error);

    await authController.refreshToken(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("handles logout success", async () => {
    const req = { body: { refreshToken: "token" } };
    const res = createRes();
    const next = jest.fn();

    mockAuthService.logout.mockResolvedValue(undefined);

    await authController.logout(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Deconnexion reussie",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards logout errors", async () => {
    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockAuthService.logout.mockRejectedValue(error);

    await authController.logout(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("handles change password success", async () => {
    const req = {
      user: { id: "user-1", role: "ADMIN" },
      body: {
        currentPassword: "old-secret",
        newPassword: "new-secret",
        confirmNewPassword: "new-secret",
      },
    };
    const res = createRes();
    const next = jest.fn();
    const payload = { message: "Mot de passe modifie avec succes" };

    mockAuthService.changePassword.mockResolvedValue(payload);

    await authController.changePassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(payload);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards change password errors", async () => {
    const req = { user: { id: "user-1" }, body: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockAuthService.changePassword.mockRejectedValue(error);

    await authController.changePassword(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("handles forgot password request success", async () => {
    const req = { body: { email: "jane.doe@example.com" } };
    const res = createRes();
    const next = jest.fn();
    const payload = {
      message: "Si un compte existe avec cet email, un code de verification a ete genere",
      data: {
        email: "jane.doe@example.com",
        expiresAt: "2026-04-12T12:00:00.000Z",
        verificationCode: "123456",
      },
    };

    mockAuthService.requestPasswordReset.mockResolvedValue(payload);

    await authController.requestPasswordReset(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(payload);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards forgot password request errors", async () => {
    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockAuthService.requestPasswordReset.mockRejectedValue(error);

    await authController.requestPasswordReset(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("handles verification code success", async () => {
    const req = {
      body: {
        email: "jane.doe@example.com",
        code: "123456",
      },
    };
    const res = createRes();
    const next = jest.fn();
    const payload = {
      message: "Code de verification valide",
      data: {
        email: "jane.doe@example.com",
        resetToken: "reset-token",
        expiresAt: "2026-04-12T12:15:00.000Z",
      },
    };

    mockAuthService.verifyPasswordResetCode.mockResolvedValue(payload);

    await authController.verifyPasswordResetCode(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(payload);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards verification code errors", async () => {
    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockAuthService.verifyPasswordResetCode.mockRejectedValue(error);

    await authController.verifyPasswordResetCode(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("handles password reset success", async () => {
    const req = {
      body: {
        email: "jane.doe@example.com",
        resetToken: "reset-token",
        newPassword: "new-secret",
        confirmNewPassword: "new-secret",
      },
    };
    const res = createRes();
    const next = jest.fn();
    const payload = { message: "Mot de passe reinitialise avec succes" };

    mockAuthService.resetPassword.mockResolvedValue(payload);

    await authController.resetPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(payload);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards password reset errors", async () => {
    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockAuthService.resetPassword.mockRejectedValue(error);

    await authController.resetPassword(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
