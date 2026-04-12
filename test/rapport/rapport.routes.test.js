let mockCurrentUser = {
  id: "admin-1",
  email: "admin@example.com",
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

jest.mock("../../src/modules/rapport/rapport.service");

const request = require("supertest");
const app = require("../../src/app");
const rapportService = require("../../src/modules/rapport/rapport.service");
const { ROLES } = require("../../src/common/utils/autorize");

describe("Rapport routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: "admin-1",
      email: "admin@example.com",
      role: ROLES.ADMIN,
      isActive: true,
    };
  });

  it("returns dashboard data", async () => {
    const payload = { cartes: {}, collectesMensuelles: {}, repartitionParType: [] };
    rapportService.getRapportDashboard.mockResolvedValue(payload);

    const response = await request(app).get("/api/v1/rapports/dashboard");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Tableau de bord recupere avec succes",
      data: payload,
    });
    expect(rapportService.getRapportDashboard).toHaveBeenCalledWith(
      mockCurrentUser,
      null,
    );
  });

  it("returns report statistics", async () => {
    const payload = { resume: {} };
    rapportService.getRapportStatistiques.mockResolvedValue(payload);

    const response = await request(app).get("/api/v1/rapports/statistiques");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Statistiques du rapport recuperees avec succes",
      data: payload,
    });
  });

  it("rejects agents on dashboard access", async () => {
    mockCurrentUser = {
      id: "agent-1",
      email: "agent@example.com",
      role: ROLES.AGENT,
      isActive: true,
    };

    const response = await request(app).get("/api/v1/rapports/dashboard");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "Vous n'avez pas l'autorisation pour cette action",
    });
  });
});
