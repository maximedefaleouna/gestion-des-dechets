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

jest.mock("../../src/modules/dechets/dechet.service");

const request = require("supertest");
const app = require("../../src/app");
const dechetService = require("../../src/modules/dechets/dechet.service");
const { ROLES } = require("../../src/common/utils/autorize");

describe("Dechets routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: "admin-1",
      email: "admin@example.com",
      role: ROLES.ADMIN,
      isActive: true,
    };
  });

  describe("GET /api/v1/dechets", () => {
    it("returns the list of dechets", async () => {
      const dechets = [
        {
          id: "dechet-1",
          nom: "Papier",
          categorie: "Recyclable",
          description: "Dechet papier",
          uniteMesure: "kg",
          dangereux: false,
        },
      ];

      dechetService.getAllDechets.mockResolvedValue(dechets);

      const response = await request(app).get("/api/v1/dechets");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Liste des dechets",
        data: dechets,
      });
      expect(dechetService.getAllDechets).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/v1/dechets", () => {
    it("creates a dechet for admin users", async () => {
      const createdDechet = {
        id: "dechet-2",
        nom: "Bouteille plastique",
        categorie: "Recyclable",
        description: "Bouteille PET",
        uniteMesure: "kg",
        dangereux: false,
      };

      dechetService.createDechet.mockResolvedValue(createdDechet);

      const response = await request(app)
        .post("/api/v1/dechets")
        .send({
          nom: "Bouteille plastique",
          categorie: "Recyclable",
          description: "Bouteille PET",
          uniteMesure: "kg",
          dangereux: false,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: "Dechet cree avec succes",
        data: createdDechet,
      });
      expect(dechetService.createDechet).toHaveBeenCalledWith({
        nom: "Bouteille plastique",
        categorie: "Recyclable",
        description: "Bouteille PET",
        uniteMesure: "kg",
        dangereux: false,
      }, expect.objectContaining({ id: "admin-1", role: ROLES.ADMIN }));
    });

    it("rejects non-admin users", async () => {
      mockCurrentUser = {
        id: "agent-1",
        email: "agent@example.com",
        role: ROLES.AGENT,
        isActive: true,
      };

      const response = await request(app)
        .post("/api/v1/dechets")
        .send({
          nom: "Bouteille plastique",
          categorie: "Recyclable",
        });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Vous n'avez pas l'autorisation pour cette action",
      });
      expect(dechetService.createDechet).not.toHaveBeenCalled();
    });

    it("returns a validation error when the category is missing", async () => {
      const response = await request(app)
        .post("/api/v1/dechets")
        .send({
          nom: "Bouteille plastique",
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "La categorie du dechet est obligatoire",
      });
      expect(dechetService.createDechet).not.toHaveBeenCalled();
    });

    it("returns an error when the body is empty", async () => {
      const response = await request(app).post("/api/v1/dechets").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Aucune donnee a enregistrer",
      });
      expect(dechetService.createDechet).not.toHaveBeenCalled();
    });

    it("returns an error when extra fields are sent", async () => {
      const response = await request(app)
        .post("/api/v1/dechets")
        .send({
          nom: "Bouteille plastique",
          categorie: "Recyclable",
          extra: true,
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Une ou plusieurs donnees ne sont pas autorisees",
      });
      expect(dechetService.createDechet).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/dechets/:id", () => {
    it("returns a validation error for an invalid id", async () => {
      const response = await request(app).get("/api/v1/dechets/not-a-mongo-id");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Identifiant dechet invalide",
      });
      expect(dechetService.getDechetById).not.toHaveBeenCalled();
    });
  });
});
