const mockAuthService = {
  login: jest.fn(),
  refreshUserToken: jest.fn(),
  logout: jest.fn(),
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
});
