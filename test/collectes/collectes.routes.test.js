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

jest.mock("../../src/modules/collectes/collecte.service");

const request = require("../helpers/request");
const app = require("../../src/app");
const collecteService = require("../../src/modules/collectes/collecte.service");
const { ROLES } = require("../../src/common/utils/autorize");

describe("Collectes routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: "admin-1",
      email: "admin@example.com",
      role: ROLES.ADMIN,
      isActive: true,
    };
  });

  describe("GET /api/v1/collectes", () => {
    it("returns the collectes list", async () => {
      collecteService.getCollectes.mockResolvedValue({
        data: [{ id: "collecte-1" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const response = await request(app).get("/api/v1/collectes");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Liste des collectes",
        data: [{ id: "collecte-1" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
      expect(collecteService.getCollectes).toHaveBeenCalledWith({}, mockCurrentUser);
    });
  });

  describe("POST /api/v1/collectes", () => {
    it("creates a collecte", async () => {
      collecteService.createCollecte.mockResolvedValue({ id: "collecte-1" });

      const response = await request(app)
        .post("/api/v1/collectes")
        .send({
          station: "station-1",
          dechet: "dechet-1",
          quantite: 250,
          commentaire: "Collecte du matin",
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: expect.any(String),
        data: { id: "collecte-1" },
      });
      expect(collecteService.createCollecte).toHaveBeenCalledWith(
        {
          station: "station-1",
          dechet: "dechet-1",
          quantite: 250,
          commentaire: "Collecte du matin",
        },
        mockCurrentUser,
      );
    });

    it("returns service errors when create fails", async () => {
      const error = Object.assign(new Error("Collecte refusee"), {
        statusCode: 409,
      });

      collecteService.createCollecte.mockRejectedValue(error);

      const response = await request(app)
        .post("/api/v1/collectes")
        .send({
          station: "station-1",
          dechet: "dechet-1",
          quantite: 250,
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        message: "Collecte refusee",
      });
    });
  });

  describe("GET /api/v1/collectes/:id", () => {
    it("returns a collecte by id", async () => {
      collecteService.getCollecteById.mockResolvedValue({
        id: "collecte-1",
      });

      const response = await request(app).get("/api/v1/collectes/collecte-1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: expect.any(String),
        data: { id: "collecte-1" },
      });
    });
  });

  describe("GET /api/v1/collectes/stats/global", () => {
    it("returns the global stats for admin users", async () => {
      collecteService.getGlobalStats.mockResolvedValue({
        resume: { totalCollectes: 3 },
      });

      const response = await request(app).get("/api/v1/collectes/stats/global");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Statistiques globales",
        data: { resume: { totalCollectes: 3 } },
      });
      expect(collecteService.getGlobalStats).toHaveBeenCalledWith(
        mockCurrentUser,
        null,
      );
    });

    it("rejects agent users", async () => {
      mockCurrentUser = {
        id: "agent-1",
        email: "agent@example.com",
        role: ROLES.AGENT,
        isActive: true,
      };

      const response = await request(app).get("/api/v1/collectes/stats/global");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Vous n'avez pas l'autorisation pour cette action",
      });
      expect(collecteService.getGlobalStats).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/collectes/stats/station/:stationId", () => {
    it("returns the station stats for admin users", async () => {
      collecteService.getStatsByStation.mockResolvedValue({
        station: { id: "station-1" },
        resume: { totalCollectes: 2 },
      });

      const response = await request(app).get(
        "/api/v1/collectes/stats/station/station-1",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Statistiques de la station",
        data: {
          station: { id: "station-1" },
          resume: { totalCollectes: 2 },
        },
      });
      expect(collecteService.getStatsByStation).toHaveBeenCalledWith(
        "station-1",
        mockCurrentUser,
        null,
      );
    });

    it("rejects agent users", async () => {
      mockCurrentUser = {
        id: "agent-1",
        email: "agent@example.com",
        role: ROLES.AGENT,
        isActive: true,
      };

      const response = await request(app).get(
        "/api/v1/collectes/stats/station/station-1",
      );

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Vous n'avez pas l'autorisation pour cette action",
      });
      expect(collecteService.getStatsByStation).not.toHaveBeenCalled();
    });
  });
});
