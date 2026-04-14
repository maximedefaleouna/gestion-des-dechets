const mockCollecteService = {
  createCollecte: jest.fn(),
  getCollectes: jest.fn(),
  getCollecteById: jest.fn(),
  updateCollecte: jest.fn(),
  deleteCollecte: jest.fn(),
  getGlobalStats: jest.fn(),
  getStatsByStation: jest.fn(),
};

jest.mock("../../src/modules/collectes/collecte.service", () => mockCollecteService);

const collecteController = require("../../src/modules/collectes/collecte.controller");

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("collecte.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a collecte", async () => {
    const req = {
      body: { station: "station-1", dechet: "dechet-1", quantite: 250 },
      user: { id: "agent-1" },
    };
    const res = createRes();
    const next = jest.fn();

    mockCollecteService.createCollecte.mockResolvedValue({ id: "collecte-1" });

    await collecteController.createCollecte(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toEqual(expect.any(Function));
    expect(res.json).toHaveBeenCalledWith({
      message: expect.any(String),
      data: { id: "collecte-1" },
    });
  });

  it("forwards create errors", async () => {
    const req = {
      body: { station: "station-1", dechet: "dechet-1", quantite: 250 },
      user: { id: "agent-1" },
    };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockCollecteService.createCollecte.mockRejectedValue(error);

    await collecteController.createCollecte(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("returns the collectes list", async () => {
    const req = { query: { page: "1" }, user: { id: "agent-1" } };
    const res = createRes();
    const next = jest.fn();

    mockCollecteService.getCollectes.mockResolvedValue({
      data: [{ id: "collecte-1" }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    await collecteController.getCollectes(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Liste des collectes",
      data: [{ id: "collecte-1" }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it("forwards list errors", async () => {
    const req = { query: { page: "1" }, user: { id: "agent-1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockCollecteService.getCollectes.mockRejectedValue(error);

    await collecteController.getCollectes(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("returns a collecte by id", async () => {
    const req = { params: { id: "collecte-1" }, user: { id: "admin-1" } };
    const res = createRes();
    const next = jest.fn();

    mockCollecteService.getCollecteById.mockResolvedValue({ id: "collecte-1" });

    await collecteController.getCollecteById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.any(String),
      data: { id: "collecte-1" },
    });
  });

  it("forwards read errors", async () => {
    const req = { params: { id: "collecte-1" }, user: { id: "admin-1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockCollecteService.getCollecteById.mockRejectedValue(error);

    await collecteController.getCollecteById(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("updates a collecte", async () => {
    const req = {
      params: { id: "collecte-1" },
      body: { commentaire: "maj" },
      user: { id: "admin-1" },
    };
    const res = createRes();
    const next = jest.fn();

    mockCollecteService.updateCollecte.mockResolvedValue({ id: "collecte-1" });

    await collecteController.updateCollecte(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.any(String),
      data: { id: "collecte-1" },
    });
  });

  it("forwards update errors", async () => {
    const req = {
      params: { id: "collecte-1" },
      body: { commentaire: "maj" },
      user: { id: "admin-1" },
    };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockCollecteService.updateCollecte.mockRejectedValue(error);

    await collecteController.updateCollecte(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("deletes a collecte", async () => {
    const req = { params: { id: "collecte-1" }, user: { id: "admin-1" } };
    const res = createRes();
    const next = jest.fn();

    mockCollecteService.deleteCollecte.mockResolvedValue({
      message: "Collecte supprimée avec succès",
    });

    await collecteController.deleteCollecte(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Collecte supprimée avec succès",
    });
  });

  it("forwards delete errors", async () => {
    const req = { params: { id: "collecte-1" }, user: { id: "admin-1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockCollecteService.deleteCollecte.mockRejectedValue(error);

    await collecteController.deleteCollecte(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("returns global stats", async () => {
    const req = {
      query: { dateDebut: "2026-04-01", dateFin: "2026-04-30" },
      user: { id: "admin-1" },
    };
    const res = createRes();
    const next = jest.fn();

    mockCollecteService.getGlobalStats.mockResolvedValue({ resume: {} });

    await collecteController.getGlobalStats(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Statistiques globales",
      data: { resume: {} },
    });
  });

  it("forwards global stats errors", async () => {
    const req = { query: {}, user: { id: "admin-1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockCollecteService.getGlobalStats.mockRejectedValue(error);

    await collecteController.getGlobalStats(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("forwards station stats errors", async () => {
    const req = {
      params: { stationId: "station-1" },
      query: {},
      user: { id: "admin-1" },
    };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockCollecteService.getStatsByStation.mockRejectedValue(error);

    await collecteController.getStatsByStation(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("returns station stats with custom period", async () => {
    const req = {
      params: { stationId: "station-1" },
      query: {
        dateDebut: "2026-01-01",
        dateFin: "2026-01-31",
      },
      user: { id: "admin-1" },
    };
    const res = createRes();
    const next = jest.fn();

    mockCollecteService.getStatsByStation.mockResolvedValue({
      station: { id: "station-1" },
      resume: { totalCollectes: 5, quantiteTotale: 500 },
    });

    await collecteController.getStatsByStation(req, res, next);

    expect(mockCollecteService.getStatsByStation).toHaveBeenCalledWith(
      "station-1",
      { id: "admin-1" },
      {
        dateDebut: "2026-01-01",
        dateFin: "2026-01-31",
      }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Statistiques de la station",
      data: { station: { id: "station-1" }, resume: { totalCollectes: 5, quantiteTotale: 500 } },
    });
  });
});
