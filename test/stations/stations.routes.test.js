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

jest.mock("../../src/modules/stations/station.service");

const request = require("../helpers/request");
const app = require("../../src/app");
const stationService = require("../../src/modules/stations/station.service");
const { ROLES } = require("../../src/common/utils/autorize");

describe("Stations routes", () => {
  const stationId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: "admin-1",
      email: "admin@example.com",
      role: ROLES.ADMIN,
      isActive: true,
    };
  });

  describe("GET /api/v1/stations", () => {
    it("returns the stations list", async () => {
      const stations = [{ id: "station-1", nom: "Centre-Ville" }];
      stationService.getAll.mockResolvedValue(stations);

      const response = await request(app).get("/api/v1/stations");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Liste des stations",
        data: stations,
      });
      expect(stationService.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/v1/stations", () => {
    it("creates a station for admin users", async () => {
      const createdStation = { id: "station-2", nom: "Confluence" };
      stationService.create.mockResolvedValue(createdStation);

      const response = await request(app)
        .post("/api/v1/stations")
        .send({
          nom: "Confluence",
          adresse: "Rue 2",
          ville: "Lome",
          capaciteMax: 1500,
          typesDechetsAcceptes: ["507f1f77bcf86cd799439011"],
          localisation: { latitude: 6.2, longitude: 1.25 },
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: "Station creee avec succes",
        data: createdStation,
      });
      expect(stationService.create).toHaveBeenCalledWith({
        nom: "Confluence",
        adresse: "Rue 2",
        ville: "Lome",
        capaciteMax: 1500,
        typesDechetsAcceptes: ["507f1f77bcf86cd799439011"],
        localisation: { latitude: 6.2, longitude: 1.25 },
      }, expect.objectContaining({ id: "admin-1", role: ROLES.ADMIN }));
    });

    it("rejects non-admin users", async () => {
      mockCurrentUser = {
        id: "agent-1",
        email: "agent@example.com",
        role: ROLES.AGENT,
        isActive: true,
      };

      const response = await request(app).post("/api/v1/stations").send({
        nom: "Confluence",
        adresse: "Rue 2",
        ville: "Lome",
        capaciteMax: 1500,
        typesDechetsAcceptes: ["507f1f77bcf86cd799439011"],
        localisation: { latitude: 6.2, longitude: 1.25 },
      });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Vous n'avez pas l'autorisation pour cette action",
      });
      expect(stationService.create).not.toHaveBeenCalled();
    });

    it("returns a validation error when the payload is empty", async () => {
      const response = await request(app).post("/api/v1/stations").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message:
          "nom, adresse, ville, capaciteMax, typesDechetsAcceptes et localisation sont obligatoires",
      });
      expect(stationService.create).not.toHaveBeenCalled();
    });

    it("returns a validation error when extra fields are sent", async () => {
      const response = await request(app)
        .post("/api/v1/stations")
        .send({
          nom: "Confluence",
          adresse: "Rue 2",
          ville: "Lome",
          capaciteMax: 1500,
          typesDechetsAcceptes: ["507f1f77bcf86cd799439011"],
          localisation: { latitude: 6.2, longitude: 1.25 },
          extra: true,
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Une ou plusieurs donnees ne sont pas autorisees",
      });
      expect(stationService.create).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/stations/:id", () => {
    it("returns a validation error for an invalid id", async () => {
      const response = await request(app).get("/api/v1/stations/not-a-mongo-id");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Identifiant station invalide",
      });
      expect(stationService.getById).not.toHaveBeenCalled();
    });
  });

  describe("PUT /api/v1/stations/:id", () => {
    it("updates a station for admin users", async () => {
      stationService.updateById.mockResolvedValue({
        id: stationId,
        nom: "Centre-Ville Renforce",
      });

      const response = await request(app)
        .put(`/api/v1/stations/${stationId}`)
        .send({
          nom: "Centre-Ville Renforce",
          adresse: "Rue 1",
          ville: "Lome",
          capaciteMax: 1200,
          typesDechetsAcceptes: ["507f1f77bcf86cd799439011"],
          localisation: { latitude: 6.2, longitude: 1.25 },
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Station mise a jour avec succes",
        data: {
          id: stationId,
          nom: "Centre-Ville Renforce",
        },
      });
    });
  });

  describe("DELETE /api/v1/stations/:id", () => {
    it("deletes a station for admin users", async () => {
      stationService.deleteById.mockResolvedValue({
        id: stationId,
        isDeleted: true,
      });

      const response = await request(app).delete(`/api/v1/stations/${stationId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Station supprimee avec succes",
        data: {
          id: stationId,
          isDeleted: true,
        },
      });
    });
  });
});
