const mockUserModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
};

jest.mock("../../src/modules/users/user.model", () => mockUserModel);

const { ROLES } = require("../../src/common/utils/autorize");
const userService = require("../../src/modules/users/user.service");

const createUserDoc = (overrides = {}) => {
  const doc = {
    _id: "user-1",
    nom: "Doe",
    prenom: "Jane",
    email: "jane.doe@example.com",
    role: ROLES.AGENT,
    isActive: true,
    createdBy: null,
    deletedBy: null,
    deletedAt: null,
    createdAt: new Date("2026-04-09T00:00:00.000Z"),
    updatedAt: new Date("2026-04-09T00:00:00.000Z"),
    refreshToken: null,
    save: jest.fn().mockResolvedValue(undefined),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    ...overrides,
  };

  return doc;
};

const createFindChain = (result) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue(result),
});

describe("user.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUsers", () => {
    it("builds the expected filters and pagination", async () => {
      const users = [
        createUserDoc({
          _id: "user-1",
          createdBy: {
            _id: "creator-1",
            nom: "Admin",
            prenom: "User",
            email: "admin@example.com",
            role: ROLES.ADMIN,
          },
          deletedBy: "deleter-1",
        }),
      ];

      mockUserModel.find.mockReturnValue(createFindChain(users));
      mockUserModel.countDocuments.mockResolvedValue(1);

      const result = await userService.getUsers({
        search: "doe",
        role: ROLES.AGENT,
        page: "2",
        limit: "200",
        sortBy: "invalid",
        order: "asc",
        includeInactive: "true",
      });

      expect(mockUserModel.find).toHaveBeenCalledWith({
        $or: [
          { nom: { $regex: "doe", $options: "i" } },
          { prenom: { $regex: "doe", $options: "i" } },
          { email: { $regex: "doe", $options: "i" } },
        ],
        role: ROLES.AGENT,
      });
      expect(result.pagination).toEqual({
        page: 2,
        limit: 100,
        total: 1,
        totalPages: 1,
      });
      expect(result.data[0]).toMatchObject({
        id: "user-1",
        createdBy: {
          id: "creator-1",
          email: "admin@example.com",
        },
        deletedBy: {
          id: "deleter-1",
        },
      });
    });

    it("uses default filters when no search is provided", async () => {
      mockUserModel.find.mockReturnValue(createFindChain([]));
      mockUserModel.countDocuments.mockResolvedValue(0);

      const result = await userService.getUsers({});

      expect(mockUserModel.find).toHaveBeenCalledWith({
        isActive: true,
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
      });
    });
  });

  describe("getUserById", () => {
    it("returns a user when access is allowed", async () => {
      const user = createUserDoc({
        _id: "user-2",
        role: ROLES.AGENT,
      });

      mockUserModel.findById.mockReturnValue(user);

      const result = await userService.getUserById("user-2", {
        id: "user-2",
        role: ROLES.AGENT,
      });

      expect(result.id).toBe("user-2");
      expect(user.populate).toHaveBeenCalledWith("createdBy", "nom prenom email role");
    });

    it("allows admins to read non SUPER_ADMIN users", async () => {
      const user = createUserDoc({
        _id: "user-2",
        role: ROLES.AGENT,
      });

      mockUserModel.findById.mockReturnValue(user);

      const result = await userService.getUserById("user-2", {
        id: "admin-1",
        role: ROLES.ADMIN,
      });

      expect(result.id).toBe("user-2");
    });

    it("allows super admins to read any user", async () => {
      const user = createUserDoc({
        _id: "user-2",
        role: ROLES.SUPER_ADMIN,
      });

      mockUserModel.findById.mockReturnValue(user);

      const result = await userService.getUserById("user-2", {
        id: "super-1",
        role: ROLES.SUPER_ADMIN,
      });

      expect(result.id).toBe("user-2");
    });

    it("rejects unauthorized access", async () => {
      const user = createUserDoc({
        _id: "user-2",
        role: ROLES.AGENT,
      });

      mockUserModel.findById.mockReturnValue(user);

      await expect(
        userService.getUserById("user-2", {
          id: "other-user",
          role: ROLES.AGENT,
        }),
      ).rejects.toMatchObject({
        message: "Vous n'avez pas l'autorisation de consulter cet utilisateur",
        statusCode: 403,
      });
    });

    it("rejects unknown users", async () => {
      const chain = {
        populate: jest.fn(),
      };
      chain.populate
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValueOnce(null),
        })
        .mockReturnThis();
      mockUserModel.findById.mockReturnValue(chain);

      await expect(
        userService.getUserById("missing", {
          id: "admin-1",
          role: ROLES.ADMIN,
        }),
      ).rejects.toMatchObject({
        message: "Utilisateur introuvable",
        statusCode: 404,
      });
    });
  });

  describe("getCurrentUser", () => {
    it("delegates to getUserById", async () => {
      const user = createUserDoc({ _id: "user-3" });
      mockUserModel.findById.mockReturnValue(user);

      const result = await userService.getCurrentUser({
        id: "user-3",
        role: ROLES.AGENT,
      });

      expect(result.id).toBe("user-3");
    });
  });

  describe("createUser", () => {
    it("creates a user for an admin", async () => {
      const created = createUserDoc({
        _id: "user-4",
        role: ROLES.ADMIN,
        email: "alice@example.com",
        createdBy: {
          _id: "admin-1",
          nom: "Admin",
          prenom: "User",
          email: "admin@example.com",
          role: ROLES.ADMIN,
        },
      });

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(created);
      mockUserModel.findById.mockReturnValue(created);

      const result = await userService.createUser(
        {
          nom: "Alice",
          prenom: "Martin",
          email: "alice@example.com",
          password: "Secret123!",
          role: ROLES.ADMIN,
        },
        { id: "admin-1", role: ROLES.ADMIN },
      );

      expect(result.email).toBe("alice@example.com");
      expect(result.role).toBe(ROLES.ADMIN);
      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "alice@example.com",
          role: ROLES.ADMIN,
          createdBy: "admin-1",
        }),
      );
    });

    it("defaults the role to AGENT when not provided", async () => {
      const created = createUserDoc({
        _id: "user-5",
        email: "alice@example.com",
      });

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(created);
      mockUserModel.findById.mockReturnValue(created);

      const result = await userService.createUser(
        {
          nom: "Alice",
          prenom: "Martin",
          email: "alice@example.com",
          password: "Secret123!",
        },
        { id: "admin-1", role: ROLES.ADMIN },
      );

      expect(result.role).toBe(ROLES.AGENT);
    });

    it("allows super admins to assign SUPER_ADMIN", async () => {
      const created = createUserDoc({
        _id: "user-6",
        email: "alice@example.com",
        role: ROLES.SUPER_ADMIN,
      });

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(created);
      mockUserModel.findById.mockReturnValue(created);

      const result = await userService.createUser(
        {
          nom: "Alice",
          prenom: "Martin",
          email: "alice@example.com",
          password: "Secret123!",
          role: ROLES.SUPER_ADMIN,
        },
        { id: "super-1", role: ROLES.SUPER_ADMIN },
      );

      expect(result.role).toBe(ROLES.SUPER_ADMIN);
    });

    it("rejects role assignment for unauthorized users", async () => {
      await expect(
        userService.createUser(
          {
            nom: "Alice",
            prenom: "Martin",
            email: "alice@example.com",
            password: "Secret123!",
            role: ROLES.SUPER_ADMIN,
          },
          { id: "admin-1", role: ROLES.ADMIN },
        ),
      ).rejects.toMatchObject({
        message: "Vous ne pouvez pas attribuer ce role",
        statusCode: 403,
      });
    });

    it("rejects duplicate emails", async () => {
      mockUserModel.findOne.mockResolvedValue(createUserDoc());

      await expect(
        userService.createUser(
          {
            nom: "Alice",
            prenom: "Martin",
            email: "alice@example.com",
            password: "Secret123!",
          },
          { id: "admin-1", role: ROLES.ADMIN },
        ),
      ).rejects.toMatchObject({
        message: "Un utilisateur avec cet email existe deja",
        statusCode: 409,
      });
    });
  });

  describe("updateUser", () => {
    it("updates the current account for an agent", async () => {
      const current = createUserDoc({
        _id: "agent-1",
        role: ROLES.AGENT,
        email: "agent@example.com",
      });
      const updated = createUserDoc({
        _id: "agent-1",
        role: ROLES.AGENT,
        email: "agent.updated@example.com",
      });

      mockUserModel.findById
        .mockReturnValueOnce(current)
        .mockReturnValueOnce(updated);
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await userService.updateUser(
        "agent-1",
        {
          email: "agent.updated@example.com",
          nom: "Updated",
          prenom: "Agent",
          password: "NewSecret123!",
        },
        { id: "agent-1", role: ROLES.AGENT },
      );

      expect(result.email).toBe("agent.updated@example.com");
      expect(current.save).toHaveBeenCalledTimes(1);
    });

    it("updates role and activation status for an admin", async () => {
      const current = createUserDoc({
        _id: "user-1",
        role: ROLES.AGENT,
        email: "agent@example.com",
      });
      const updated = createUserDoc({
        _id: "user-1",
        role: ROLES.ADMIN,
        email: "agent@example.com",
        isActive: false,
      });

      mockUserModel.findById
        .mockReturnValueOnce(current)
        .mockReturnValueOnce(updated);
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.countDocuments.mockResolvedValue(2);

      const result = await userService.updateUser(
        "user-1",
        {
          role: ROLES.ADMIN,
          isActive: false,
        },
        { id: "admin-1", role: ROLES.ADMIN },
      );

      expect(result.role).toBe(ROLES.ADMIN);
      expect(result.isActive).toBe(false);
      expect(current.save).toHaveBeenCalledTimes(1);
    });

    it("rejects agent updates on another account", async () => {
      mockUserModel.findById.mockReturnValue(createUserDoc({ _id: "other-user" }));

      await expect(
        userService.updateUser(
          "other-user",
          { nom: "Updated" },
          { id: "agent-1", role: ROLES.AGENT },
        ),
      ).rejects.toMatchObject({
        message: "Vous ne pouvez modifier que votre propre compte",
        statusCode: 403,
      });
    });

    it("rejects agents from changing account status", async () => {
      const current = createUserDoc({
        _id: "agent-1",
        role: ROLES.AGENT,
      });
      mockUserModel.findById.mockReturnValue(current);

      await expect(
        userService.updateUser(
          "agent-1",
          { isActive: false },
          { id: "agent-1", role: ROLES.AGENT },
        ),
      ).rejects.toMatchObject({
        message: "Vous ne pouvez pas changer le statut du compte",
        statusCode: 403,
      });
    });

    it("rejects unknown users", async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue(null),
      });

      await expect(
        userService.updateUser(
          "missing",
          { nom: "Updated" },
          { id: "admin-1", role: ROLES.ADMIN },
        ),
      ).rejects.toMatchObject({
        message: "Utilisateur introuvable",
        statusCode: 404,
      });
    });

    it("rejects duplicate email changes", async () => {
      const current = createUserDoc({
        _id: "user-1",
        email: "current@example.com",
        role: ROLES.ADMIN,
      });

      mockUserModel.findById.mockReturnValue(current);
      mockUserModel.findOne.mockResolvedValue(createUserDoc({ _id: "other-user" }));

      await expect(
        userService.updateUser(
          "user-1",
          { email: "new@example.com" },
          { id: "admin-1", role: ROLES.ADMIN },
        ),
      ).rejects.toMatchObject({
        message: "Un utilisateur avec cet email existe deja",
        statusCode: 409,
      });
    });

    it("prevents disabling the last super admin", async () => {
      const superAdmin = createUserDoc({
        _id: "super-1",
        role: ROLES.SUPER_ADMIN,
      });

      mockUserModel.findById.mockReturnValue(superAdmin);
      mockUserModel.countDocuments.mockResolvedValue(1);

      await expect(
        userService.updateUser(
          "super-1",
          { isActive: false },
          { id: "admin-1", role: ROLES.SUPER_ADMIN },
        ),
      ).rejects.toMatchObject({
        message: "Impossible de desactiver le dernier SUPER_ADMIN",
        statusCode: 400,
      });
    });
  });

  describe("deleteUser", () => {
    it("deactivates a user", async () => {
      const target = createUserDoc({
        _id: "user-5",
        role: ROLES.AGENT,
      });

      mockUserModel.findById.mockReturnValue(target);

      const result = await userService.deleteUser("user-5", {
        id: "admin-1",
        role: ROLES.ADMIN,
      });

      expect(result.message).toBe(
        "Utilisateur desactive avec succes. Les donnees d'activite sont conservees.",
      );
      expect(target.isActive).toBe(false);
      expect(target.save).toHaveBeenCalledTimes(1);
    });

    it("rejects agent attempts to delete another account", async () => {
      mockUserModel.findById.mockReturnValue(createUserDoc({ _id: "user-6" }));

      await expect(
        userService.deleteUser("user-6", {
          id: "agent-1",
          role: ROLES.AGENT,
        }),
      ).rejects.toMatchObject({
        message: "Vous n'avez pas l'autorisation de modifier cet utilisateur",
        statusCode: 403,
      });
    });

    it("rejects unknown users", async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue(null),
      });

      await expect(
        userService.deleteUser("unknown", {
          id: "admin-1",
          role: ROLES.ADMIN,
        }),
      ).rejects.toMatchObject({
        message: "Utilisateur introuvable",
        statusCode: 404,
      });
    });
  });
});
