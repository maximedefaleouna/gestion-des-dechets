const mockDechetService = {
  createDechet: jest.fn(),
  getAllDechets: jest.fn(),
  getDechetById: jest.fn(),
  updateDechet: jest.fn(),
  deleteDechet: jest.fn(),
};

jest.mock("../../src/modules/dechets/dechet.service", () => mockDechetService);

const dechetController = require("../../src/modules/dechets/dechet.controller");

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("dechet.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a dechet", async () => {
    const req = { body: { nom: "Papier" } };
    const res = createRes();
    const next = jest.fn();

    mockDechetService.createDechet.mockResolvedValue({ id: "d1" });

    await dechetController.createDechet(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Dechet cree avec succes",
      data: { id: "d1" },
    });
  });

  it("forwards create errors", async () => {
    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockDechetService.createDechet.mockRejectedValue(error);

    await dechetController.createDechet(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("returns the list of dechets", async () => {
    const req = {};
    const res = createRes();
    const next = jest.fn();

    mockDechetService.getAllDechets.mockResolvedValue([{ id: "d1" }]);

    await dechetController.getDechets(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Liste des dechets",
      data: [{ id: "d1" }],
    });
  });

  it("forwards getDechets errors", async () => {
    const req = {};
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockDechetService.getAllDechets.mockRejectedValue(error);

    await dechetController.getDechets(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("returns a dechet by id", async () => {
    const req = { params: { id: "d1" } };
    const res = createRes();
    const next = jest.fn();

    mockDechetService.getDechetById.mockResolvedValue({ id: "d1" });

    await dechetController.getDechetById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Dechet recupere avec succes",
      data: { id: "d1" },
    });
  });

  it("forwards getDechetById errors", async () => {
    const req = { params: { id: "d1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockDechetService.getDechetById.mockRejectedValue(error);

    await dechetController.getDechetById(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("updates a dechet", async () => {
    const req = { params: { id: "d1" }, body: { nom: "Metal" } };
    const res = createRes();
    const next = jest.fn();

    mockDechetService.updateDechet.mockResolvedValue({ id: "d1" });

    await dechetController.updateDechet(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Dechet mis a jour avec succes",
      data: { id: "d1" },
    });
  });

  it("forwards updateDechet errors", async () => {
    const req = { params: { id: "d1" }, body: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockDechetService.updateDechet.mockRejectedValue(error);

    await dechetController.updateDechet(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("deletes a dechet", async () => {
    const req = { params: { id: "d1" } };
    const res = createRes();
    const next = jest.fn();

    mockDechetService.deleteDechet.mockResolvedValue({ id: "d1" });

    await dechetController.deleteDechet(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Dechet supprime avec succes",
      data: { id: "d1" },
    });
  });

  it("forwards deleteDechet errors", async () => {
    const req = { params: { id: "d1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockDechetService.deleteDechet.mockRejectedValue(error);

    await dechetController.deleteDechet(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
