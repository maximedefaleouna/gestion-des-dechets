const mockUserService = {
  createUser: jest.fn(),
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  getCurrentUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

jest.mock("../../src/modules/users/user.service", () => mockUserService);

const userController = require("../../src/modules/users/user.controller");

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("user.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a user", async () => {
    const req = {
      body: { nom: "Alice" },
      user: { id: "admin-1", role: "ADMIN" },
    };
    const res = createRes();
    const next = jest.fn();
    const created = { id: "user-1" };

    mockUserService.createUser.mockResolvedValue(created);

    await userController.createUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Utilisateur cree avec succes",
      data: created,
    });
  });

  it("forwards create errors", async () => {
    const req = { body: {}, user: { id: "admin-1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockUserService.createUser.mockRejectedValue(error);

    await userController.createUser(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("returns the users list", async () => {
    const req = { query: { page: "1" } };
    const res = createRes();
    const next = jest.fn();
    const result = { data: [{ id: "user-1" }], pagination: { page: 1 } };

    mockUserService.getUsers.mockResolvedValue(result);

    await userController.getUsers(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Liste des utilisateurs",
      ...result,
    });
  });

  it("forwards getUsers errors", async () => {
    const req = { query: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockUserService.getUsers.mockRejectedValue(error);

    await userController.getUsers(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("returns a user by id", async () => {
    const req = { params: { id: "user-1" }, user: { id: "admin-1" } };
    const res = createRes();
    const next = jest.fn();

    mockUserService.getUserById.mockResolvedValue({ id: "user-1" });

    await userController.getUserById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Utilisateur recupere avec succes",
      data: { id: "user-1" },
    });
  });

  it("forwards getUserById errors", async () => {
    const req = { params: { id: "user-1" }, user: { id: "admin-1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockUserService.getUserById.mockRejectedValue(error);

    await userController.getUserById(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("returns the current profile", async () => {
    const req = { user: { id: "user-1" } };
    const res = createRes();
    const next = jest.fn();

    mockUserService.getCurrentUser.mockResolvedValue({ id: "user-1" });

    await userController.getMe(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Profil utilisateur",
      data: { id: "user-1" },
    });
  });

  it("forwards getMe errors", async () => {
    const req = { user: { id: "user-1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockUserService.getCurrentUser.mockRejectedValue(error);

    await userController.getMe(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("updates a user", async () => {
    const req = { params: { id: "user-1" }, body: { nom: "Alice" }, user: { id: "admin-1" } };
    const res = createRes();
    const next = jest.fn();

    mockUserService.updateUser.mockResolvedValue({ id: "user-1" });

    await userController.updateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Utilisateur mis a jour avec succes",
      data: { id: "user-1" },
    });
  });

  it("forwards updateUser errors", async () => {
    const req = { params: { id: "user-1" }, body: {}, user: { id: "admin-1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockUserService.updateUser.mockRejectedValue(error);

    await userController.updateUser(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("updates the current user profile", async () => {
    const req = { body: { nom: "Alice" }, user: { id: "user-1" } };
    const res = createRes();
    const next = jest.fn();

    mockUserService.updateUser.mockResolvedValue({ id: "user-1" });

    await userController.updateMe(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Profil mis a jour avec succes",
      data: { id: "user-1" },
    });
  });

  it("forwards updateMe errors", async () => {
    const req = { body: {}, user: { id: "user-1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockUserService.updateUser.mockRejectedValue(error);

    await userController.updateMe(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("deletes a user", async () => {
    const req = { params: { id: "user-1" }, user: { id: "admin-1" } };
    const res = createRes();
    const next = jest.fn();

    mockUserService.deleteUser.mockResolvedValue({
      message: "Utilisateur desactive avec succes. Les donnees d'activite sont conservees.",
    });

    await userController.deleteUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Utilisateur desactive avec succes. Les donnees d'activite sont conservees.",
    });
  });

  it("forwards deleteUser errors", async () => {
    const req = { params: { id: "user-1" }, user: { id: "admin-1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockUserService.deleteUser.mockRejectedValue(error);

    await userController.deleteUser(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
