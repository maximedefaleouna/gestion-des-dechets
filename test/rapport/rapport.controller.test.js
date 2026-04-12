const mockRapportService = {
  getRapportStatistiques: jest.fn(),
  getRapportDashboard: jest.fn(),
};

jest.mock("../../src/modules/rapport/rapport.service", () => mockRapportService);

const rapportController = require("../../src/modules/rapport/rapport.controller");

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("rapport.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns report statistics", async () => {
    const req = {
      user: { id: "admin-1", role: "ADMIN" },
      query: { dateDebut: "2026-04-01", dateFin: "2026-04-30" },
    };
    const res = createRes();
    const next = jest.fn();

    mockRapportService.getRapportStatistiques.mockResolvedValue({ resume: {} });

    await rapportController.getStatistiques(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Statistiques du rapport recuperees avec succes",
      data: { resume: {} },
    });
  });

  it("returns dashboard data", async () => {
    const req = {
      user: { id: "admin-1", role: "ADMIN" },
      query: {},
    };
    const res = createRes();
    const next = jest.fn();

    mockRapportService.getRapportDashboard.mockResolvedValue({ cartes: {} });

    await rapportController.getDashboard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Tableau de bord recupere avec succes",
      data: { cartes: {} },
    });
  });

  it("forwards report errors", async () => {
    const req = { user: { id: "admin-1", role: "ADMIN" }, query: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockRapportService.getRapportDashboard.mockRejectedValue(error);

    await rapportController.getDashboard(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("forwards statistics errors", async () => {
    const req = { user: { id: "admin-1", role: "ADMIN" }, query: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockRapportService.getRapportStatistiques.mockRejectedValue(error);

    await rapportController.getStatistiques(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
