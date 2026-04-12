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

jest.mock("../../src/modules/users/user.service");

const request = require("supertest");
const app = require("../../src/app");
const userService = require("../../src/modules/users/user.service");
const { ROLES } = require("../../src/common/utils/autorize");

describe("Users routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: "admin-1",
      email: "admin@example.com",
      role: ROLES.ADMIN,
      isActive: true,
    };
  });

  describe("GET /api/v1/users/me", () => {
    it("returns the current user profile", async () => {
      const profile = {
        id: "agent-1",
        nom: "Doe",
        prenom: "Jane",
        email: "jane.doe@example.com",
        role: ROLES.AGENT,
        isActive: true,
        createdBy: null,
        deletedBy: null,
        deletedAt: null,
        createdAt: "2026-04-09T00:00:00.000Z",
        updatedAt: "2026-04-09T00:00:00.000Z",
      };

      mockCurrentUser = {
        id: "agent-1",
        email: "jane.doe@example.com",
        role: ROLES.AGENT,
        isActive: true,
      };
      userService.getCurrentUser.mockResolvedValue(profile);

      const response = await request(app).get("/api/v1/users/me");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Profil utilisateur",
        data: profile,
      });
      expect(userService.getCurrentUser).toHaveBeenCalledWith(mockCurrentUser);
    });
  });

  describe("POST /api/v1/users", () => {
    it("creates a user for admin roles", async () => {
      const createdUser = {
        id: "user-2",
        nom: "Martin",
        prenom: "Alice",
        email: "alice.martin@example.com",
        role: ROLES.AGENT,
        isActive: true,
        createdBy: {
          id: "admin-1",
          nom: "Admin",
          prenom: "User",
          email: "admin@example.com",
          role: ROLES.ADMIN,
        },
        deletedBy: null,
        deletedAt: null,
        createdAt: "2026-04-09T00:00:00.000Z",
        updatedAt: "2026-04-09T00:00:00.000Z",
      };

      userService.createUser.mockResolvedValue(createdUser);

      const response = await request(app)
        .post("/api/v1/users")
        .send({
          nom: "Martin",
          prenom: "Alice",
          email: "alice.martin@example.com",
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: "Utilisateur cree avec succes",
        data: createdUser,
      });
      expect(userService.createUser).toHaveBeenCalledWith(
        {
          nom: "Martin",
          prenom: "Alice",
          email: "alice.martin@example.com",
        },
        mockCurrentUser,
      );
    });

    it("returns a validation error when the payload is incomplete", async () => {
      const response = await request(app)
        .post("/api/v1/users")
        .send({ nom: "Martin" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Le prenom est obligatoire",
      });
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it("returns an error when the body is empty", async () => {
      const response = await request(app).post("/api/v1/users").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "nom, prenom et email sont obligatoires",
      });
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it("returns an error when extra fields are sent", async () => {
      const response = await request(app)
        .post("/api/v1/users")
        .send({
          nom: "Martin",
          prenom: "Alice",
          email: "alice@example.com",
          password: "Secret123!",
          age: 30,
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Une ou plusieurs donnees ne sont pas autorisees",
      });
      expect(userService.createUser).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/users", () => {
    it("rejects non-admin users", async () => {
      mockCurrentUser = {
        id: "agent-1",
        email: "agent@example.com",
        role: ROLES.AGENT,
        isActive: true,
      };

      const response = await request(app).get("/api/v1/users");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Vous n'avez pas l'autorisation pour cette action",
      });
      expect(userService.getUsers).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/users/:id", () => {
    it("returns a validation error for an invalid id", async () => {
      const response = await request(app).get("/api/v1/users/not-a-mongo-id");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Identifiant utilisateur invalide",
      });
      expect(userService.getUserById).not.toHaveBeenCalled();
    });
  });
});
