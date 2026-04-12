const mockCollecteModel = jest.fn();
mockCollecteModel.find = jest.fn();
mockCollecteModel.findById = jest.fn();
mockCollecteModel.findByIdAndDelete = jest.fn();
mockCollecteModel.create = jest.fn();
mockCollecteModel.aggregate = jest.fn();
mockCollecteModel.countDocuments = jest.fn();

const mockStationModel = {
  findById: jest.fn(),
  countDocuments: jest.fn(),
};

const mockDechetModel = {
  findById: jest.fn(),
};

jest.mock("../../src/modules/collectes/collecte.model", () => mockCollecteModel);
jest.mock("../../src/modules/stations/station.model", () => mockStationModel);
jest.mock("../../src/modules/dechets/dechet.model", () => mockDechetModel);

const { ROLES } = require("../../src/common/utils/autorize");
const collecteService = require("../../src/modules/collectes/collecte.service");

const createUserRef = (id, overrides = {}) => ({
  _id: id,
  toString: () => id,
  ...overrides,
});

const createStationDoc = (overrides = {}) => ({
  _id: "station-1",
  nom: "Centre-Ville",
  adresse: "Rue 1",
  ville: "Lome",
  capaciteMax: 1000,
  capaciteActuelle: 250,
  statut: "ACTIVE",
  typesDechetsAcceptes: ["dechet-1"],
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const createDechetDoc = (overrides = {}) => ({
  _id: "dechet-1",
  nom: "Plastique",
  categorie: "Recyclable",
  uniteMesure: "kg",
  ...overrides,
});

const createCollecteDoc = (overrides = {}) => ({
  _id: "collecte-1",
  station: createUserRef("station-1", {
    nom: "Centre-Ville",
    adresse: "Rue 1",
    ville: "Lome",
  }),
  dechet: createUserRef("dechet-1", {
    nom: "Plastique",
    categorie: "Recyclable",
    uniteMesure: "kg",
  }),
  agent: createUserRef("agent-1", {
    nom: "Doe",
    prenom: "Jane",
    email: "jane@example.com",
  }),
  quantite: 250,
  dateCollecte: new Date("2026-04-10T10:00:00.000Z"),
  statut: "VALIDEE",
  commentaire: "Collecte du matin",
  createdAt: new Date("2026-04-10T10:00:00.000Z"),
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const createQueryResult = (value) => {
  const query = {
    populate: jest.fn(() => query),
    sort: jest.fn(() => query),
    skip: jest.fn(() => query),
    limit: jest.fn(() => query),
    then: (resolve) => Promise.resolve(resolve(value)),
  };

  return query;
};

describe("collecte.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCollecte", () => {
    it("creates a collecte and updates the station capacity", async () => {
      const station = createStationDoc({ capaciteActuelle: 100 });
      const dechet = createDechetDoc();
      const createdCollecte = { _id: "collecte-1" };
      const hydratedCollecte = createCollecteDoc({
        quantite: 200,
        station: createUserRef("station-1", {
          nom: "Centre-Ville",
          adresse: "Rue 1",
          ville: "Lome",
        }),
      });

      mockStationModel.findById.mockResolvedValue(station);
      mockDechetModel.findById.mockResolvedValue(dechet);
      mockCollecteModel.create.mockResolvedValue(createdCollecte);
      mockCollecteModel.findById.mockReturnValue(createQueryResult(hydratedCollecte));

      const result = await collecteService.createCollecte(
        {
          station: "station-1",
          dechet: "dechet-1",
          quantite: 200,
          commentaire: "Collecte du matin",
        },
        { id: "agent-1" },
      );

      expect(result).toMatchObject({
        id: "collecte-1",
        station: {
          id: "station-1",
          nom: "Centre-Ville",
        },
        dechet: {
          id: "dechet-1",
          nom: "Plastique",
        },
        agent: {
          id: "agent-1",
          nom: "Doe",
        },
        quantite: 200,
        statut: "VALIDEE",
      });
      expect(mockStationModel.findById).toHaveBeenCalledWith("station-1");
      expect(mockDechetModel.findById).toHaveBeenCalledWith("dechet-1");
      expect(mockCollecteModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          station: "station-1",
          dechet: "dechet-1",
          agent: "agent-1",
          quantite: 200,
          statut: "VALIDEE",
          commentaire: "Collecte du matin",
        }),
      );
      expect(station.save).toHaveBeenCalledTimes(1);
    });

    it("returns null when the hydrated collecte cannot be loaded", async () => {
      const station = createStationDoc({ capaciteActuelle: 100 });
      const dechet = createDechetDoc();
      const createdCollecte = { _id: "collecte-1" };

      mockStationModel.findById.mockResolvedValue(station);
      mockDechetModel.findById.mockResolvedValue(dechet);
      mockCollecteModel.create.mockResolvedValue(createdCollecte);
      mockCollecteModel.findById.mockReturnValue(createQueryResult(null));

      const result = await collecteService.createCollecte(
        {
          station: "station-1",
          dechet: "dechet-1",
          quantite: 200,
        },
        { id: "agent-1" },
      );

      expect(result).toBeNull();
    });

    it("rejects an unknown station", async () => {
      mockStationModel.findById.mockResolvedValue(null);

      await expect(
        collecteService.createCollecte(
          {
            station: "station-404",
            dechet: "dechet-1",
            quantite: 200,
          },
          { id: "agent-1" },
        ),
      ).rejects.toThrow("Station non trouvée");
    });

    it("rejects a collecte when the station capacity is insufficient", async () => {
      mockStationModel.findById.mockResolvedValue(
        createStationDoc({ capaciteActuelle: 900, capaciteMax: 1000 }),
      );
      mockDechetModel.findById.mockResolvedValue(createDechetDoc());

      await expect(
        collecteService.createCollecte(
          {
            station: "station-1",
            dechet: "dechet-1",
            quantite: 200,
          },
          { id: "agent-1" },
        ),
      ).rejects.toThrow("Capacité insuffisante dans cette station");
    });
  });

  describe("createCollecte", () => {
    it("rejects inactive stations", async () => {
      mockStationModel.findById.mockResolvedValue(
        createStationDoc({ statut: "INACTIVE" }),
      );
      mockDechetModel.findById.mockResolvedValue(createDechetDoc());

      await expect(
        collecteService.createCollecte(
          {
            station: "station-1",
            dechet: "dechet-1",
            quantite: 200,
          },
          { id: "agent-1" },
        ),
      ).rejects.toThrow("Cette station n'est pas active");
    });

    it("rejects unknown dechets", async () => {
      mockStationModel.findById.mockResolvedValue(createStationDoc());
      mockDechetModel.findById.mockResolvedValue(null);

      await expect(
        collecteService.createCollecte(
          {
            station: "station-1",
            dechet: "dechet-404",
            quantite: 200,
          },
          { id: "agent-1" },
        ),
      ).rejects.toThrow("Type de déchet non trouvé");
    });

    it("rejects stations that do not accept the dechet type", async () => {
      mockStationModel.findById.mockResolvedValue(
        createStationDoc({ typesDechetsAcceptes: ["dechet-2"] }),
      );
      mockDechetModel.findById.mockResolvedValue(createDechetDoc());

      await expect(
        collecteService.createCollecte(
          {
            station: "station-1",
            dechet: "dechet-1",
            quantite: 200,
          },
          { id: "agent-1" },
        ),
      ).rejects.toThrow("Cette station n'accepte pas ce type de déchet");
    });
  });

  describe("getCollectes", () => {
    it("filters collectes for agent users and returns pagination", async () => {
      const collectes = [
        createCollecteDoc({
          _id: "collecte-1",
          agent: createUserRef("agent-1", {
            nom: "Doe",
            prenom: "Jane",
            email: "jane@example.com",
          }),
        }),
      ];

      mockCollecteModel.find.mockReturnValue(createQueryResult(collectes));
      mockCollecteModel.countDocuments.mockResolvedValue(1);

      const result = await collecteService.getCollectes(
        {
          page: "2",
          limit: "5",
          sortBy: "dateCollecte",
          order: "asc",
          statut: "VALIDEE",
        },
        { id: "agent-1", role: ROLES.AGENT },
      );

      expect(mockCollecteModel.find).toHaveBeenCalledWith({
        statut: "VALIDEE",
        agent: "agent-1",
      });
      expect(mockCollecteModel.countDocuments).toHaveBeenCalledWith({
        statut: "VALIDEE",
        agent: "agent-1",
      });
      expect(result).toEqual({
        data: [
          expect.objectContaining({
            id: "collecte-1",
            agent: expect.objectContaining({ id: "agent-1" }),
          }),
        ],
        pagination: {
          page: 2,
          limit: 5,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it("applies station, dechet, date and agent filters for admins", async () => {
      const collectes = [];

      mockCollecteModel.find.mockReturnValue(createQueryResult(collectes));
      mockCollecteModel.countDocuments.mockResolvedValue(0);

      await collecteService.getCollectes(
        {
          stationId: "station-1",
          dechetId: "dechet-1",
          agentId: "agent-2",
          statut: "VALIDEE",
          dateDebut: "2026-04-01",
          dateFin: "2026-04-30",
          sortBy: "quantite",
          order: "desc",
        },
        { id: "admin-1", role: ROLES.ADMIN },
      );

      expect(mockCollecteModel.find).toHaveBeenCalledWith({
        station: "station-1",
        dechet: "dechet-1",
        statut: "VALIDEE",
        dateCollecte: {
          $gte: new Date("2026-04-01"),
          $lte: new Date("2026-04-30"),
        },
        agent: "agent-2",
      });
    });

    it("forces agent users to only see their own collectes", async () => {
      mockCollecteModel.find.mockReturnValue(createQueryResult([]));
      mockCollecteModel.countDocuments.mockResolvedValue(0);

      await collecteService.getCollectes(
        {
          agentId: "agent-2",
        },
        { id: "agent-1", role: ROLES.AGENT },
      );

      expect(mockCollecteModel.find).toHaveBeenCalledWith({
        agent: "agent-1",
      });
    });
  });

  describe("getCollecteById", () => {
    it("returns a collecte for admin users", async () => {
      const collecte = createCollecteDoc();
      mockCollecteModel.findById.mockReturnValue(createQueryResult(collecte));

      await expect(
        collecteService.getCollecteById("collecte-1", {
          id: "admin-1",
          role: ROLES.ADMIN,
        }),
      ).resolves.toMatchObject({
        id: "collecte-1",
        station: { id: "station-1" },
      });
    });

    it("sanitizes null relations", async () => {
      const collecte = createCollecteDoc({
        station: null,
        dechet: null,
        agent: null,
      });
      mockCollecteModel.findById.mockReturnValue(createQueryResult(collecte));

      const result = await collecteService.getCollecteById("collecte-1", {
        id: "admin-1",
        role: ROLES.ADMIN,
      });

      expect(result.station).toBeNull();
      expect(result.dechet).toBeNull();
      expect(result.agent).toBeNull();
    });

    it("rejects unauthorized agents", async () => {
      const collecte = createCollecteDoc({
        agent: createUserRef("other-agent", {
          nom: "Other",
          prenom: "Agent",
          email: "other@example.com",
        }),
      });
      mockCollecteModel.findById.mockReturnValue(createQueryResult(collecte));

      await expect(
        collecteService.getCollecteById("collecte-1", {
          id: "agent-1",
          role: ROLES.AGENT,
        }),
      ).rejects.toThrow(
        "Vous n'avez pas l'autorisation de consulter cette collecte",
      );
    });

    it("allows a super admin to read any collecte", async () => {
      const collecte = createCollecteDoc({
        agent: createUserRef("other-agent", {
          nom: "Other",
          prenom: "Agent",
          email: "other@example.com",
        }),
      });
      mockCollecteModel.findById.mockReturnValue(createQueryResult(collecte));

      await expect(
        collecteService.getCollecteById("collecte-1", {
          id: "super-1",
          role: ROLES.SUPER_ADMIN,
        }),
      ).resolves.toMatchObject({
        id: "collecte-1",
      });
    });

    it("rejects missing collectes", async () => {
      mockCollecteModel.findById.mockReturnValue(createQueryResult(null));

      await expect(
        collecteService.getCollecteById("collecte-404", {
          id: "admin-1",
          role: ROLES.ADMIN,
        }),
      ).rejects.toThrow(/Collecte non trouv/);
    });

    it("allows an agent to read their own collecte", async () => {
      const collecte = createCollecteDoc({
        agent: createUserRef("agent-1", {
          nom: "Doe",
          prenom: "Jane",
          email: "jane@example.com",
        }),
      });
      mockCollecteModel.findById.mockReturnValue(createQueryResult(collecte));

      await expect(
        collecteService.getCollecteById("collecte-1", {
          id: "agent-1",
          role: ROLES.AGENT,
        }),
      ).resolves.toMatchObject({
        id: "collecte-1",
        agent: { id: "agent-1" },
      });
    });
  });

  describe("updateCollecte", () => {
    it("updates the collecte quantity and station capacity", async () => {
      const station = createStationDoc({ capaciteActuelle: 250 });
      const collecte = createCollecteDoc({
        quantite: 150,
        station: createUserRef("station-1"),
      });
      const updatedCollecte = createCollecteDoc({
        quantite: 200,
      });

      mockCollecteModel.findById
        .mockReturnValueOnce(createQueryResult(collecte))
        .mockReturnValueOnce(createQueryResult(updatedCollecte));
      mockStationModel.findById.mockResolvedValue(station);

      const result = await collecteService.updateCollecte(
        "collecte-1",
        { quantite: 200, commentaire: "maj" },
        { id: "admin-1", role: ROLES.ADMIN },
      );

      expect(result).toMatchObject({
        id: "collecte-1",
        quantite: 200,
      });
      expect(station.save).toHaveBeenCalledTimes(1);
      expect(collecte.save).toHaveBeenCalledTimes(1);
    });

    it("rejects missing collectes", async () => {
      mockCollecteModel.findById.mockReturnValue(createQueryResult(null));

      await expect(
        collecteService.updateCollecte(
          "collecte-404",
          { commentaire: "maj" },
          { id: "admin-1", role: ROLES.ADMIN },
        ),
      ).rejects.toThrow(/Collecte non trouv/);
    });

    it("updates status and date without changing quantity", async () => {
      const collecte = createCollecteDoc({
        quantite: 150,
        station: createUserRef("station-1"),
      });
      const updatedCollecte = createCollecteDoc({
        quantite: 150,
        statut: "ANNULEE",
      });

      mockCollecteModel.findById
        .mockReturnValueOnce(createQueryResult(collecte))
        .mockReturnValueOnce(createQueryResult(updatedCollecte));

      const result = await collecteService.updateCollecte(
        "collecte-1",
        {
          statut: "ANNULEE",
          dateCollecte: "2026-04-11T10:00:00.000Z",
        },
        { id: "admin-1", role: ROLES.ADMIN },
      );

      expect(result.statut).toBe("ANNULEE");
      expect(collecte.dateCollecte).toBeInstanceOf(Date);
      expect(collecte.save).toHaveBeenCalledTimes(1);
    });

    it("rejects unauthorized modifications", async () => {
      const collecte = createCollecteDoc({
        agent: createUserRef("other-agent"),
      });
      mockCollecteModel.findById.mockReturnValue(createQueryResult(collecte));

      await expect(
        collecteService.updateCollecte(
          "collecte-1",
          { commentaire: "maj" },
          { id: "agent-1", role: ROLES.AGENT },
        ),
      ).rejects.toThrow(
        "Vous n'avez pas l'autorisation de modifier cette collecte",
      );
    });

    it("allows a super admin to modify any collecte", async () => {
      const collecte = createCollecteDoc({
        agent: createUserRef("other-agent"),
      });
      const updatedCollecte = createCollecteDoc({
        commentaire: "super-admin",
      });

      mockCollecteModel.findById
        .mockReturnValueOnce(createQueryResult(collecte))
        .mockReturnValueOnce(createQueryResult(updatedCollecte));

      const result = await collecteService.updateCollecte(
        "collecte-1",
        { commentaire: "super-admin" },
        { id: "super-1", role: ROLES.SUPER_ADMIN },
      );

      expect(result.commentaire).toBe("super-admin");
      expect(collecte.save).toHaveBeenCalledTimes(1);
    });

    it("allows an agent to modify their own non-validated collecte", async () => {
      const collecte = createCollecteDoc({
        agent: createUserRef("agent-1"),
        statut: "EN_ATTENTE",
      });
      const updatedCollecte = createCollecteDoc({
        agent: createUserRef("agent-1"),
        statut: "EN_ATTENTE",
        commentaire: "mis a jour",
      });

      mockCollecteModel.findById
        .mockReturnValueOnce(createQueryResult(collecte))
        .mockReturnValueOnce(createQueryResult(updatedCollecte));
      mockStationModel.findById.mockResolvedValue(
        createStationDoc({ capaciteActuelle: 250 }),
      );

      const result = await collecteService.updateCollecte(
        "collecte-1",
        { commentaire: "mis a jour" },
        { id: "agent-1", role: ROLES.AGENT },
      );

      expect(result.commentaire).toBe("mis a jour");
      expect(collecte.save).toHaveBeenCalledTimes(1);
    });

    it("rejects quantity updates when station capacity is exceeded", async () => {
      const collecte = createCollecteDoc({
        quantite: 150,
        station: createUserRef("station-1"),
      });

      mockCollecteModel.findById.mockReturnValue(createQueryResult(collecte));
      mockStationModel.findById.mockResolvedValue(
        createStationDoc({ capaciteActuelle: 1000, capaciteMax: 1000 }),
      );

      await expect(
        collecteService.updateCollecte(
          "collecte-1",
          { quantite: 200 },
          { id: "admin-1", role: ROLES.ADMIN },
        ),
      ).rejects.toThrow(/Capacit/);
    });
  });

  describe("deleteCollecte", () => {
    it("restores the station capacity when deleting a collecte", async () => {
      const collecte = createCollecteDoc({ quantite: 150 });
      const station = createStationDoc({ capaciteActuelle: 500 });

      mockCollecteModel.findById.mockResolvedValue(collecte);
      mockStationModel.findById.mockResolvedValue(station);
      mockCollecteModel.findByIdAndDelete.mockResolvedValue(collecte);

      const result = await collecteService.deleteCollecte("collecte-1", {
        id: "admin-1",
        role: ROLES.ADMIN,
      });

      expect(result).toMatchObject({
        message: expect.stringContaining("Collecte supprim"),
      });
      expect(station.save).toHaveBeenCalledTimes(1);
      expect(mockCollecteModel.findByIdAndDelete).toHaveBeenCalledWith(
        "collecte-1",
      );
    });

    it("deletes a collecte even when the station is missing", async () => {
      const collecte = createCollecteDoc({ quantite: 150 });

      mockCollecteModel.findById.mockResolvedValue(collecte);
      mockStationModel.findById.mockResolvedValue(null);
      mockCollecteModel.findByIdAndDelete.mockResolvedValue(collecte);

      const result = await collecteService.deleteCollecte("collecte-1", {
        id: "admin-1",
        role: ROLES.ADMIN,
      });

      expect(result).toMatchObject({
        message: expect.stringContaining("Collecte supprim"),
      });
      expect(mockStationModel.findById).toHaveBeenCalledWith(
        expect.objectContaining({ _id: "station-1" }),
      );
    });

    it("rejects unauthorized deletions", async () => {
      const collecte = createCollecteDoc({
        agent: createUserRef("other-agent"),
      });
      mockCollecteModel.findById.mockResolvedValue(collecte);

      await expect(
        collecteService.deleteCollecte("collecte-1", {
          id: "agent-1",
          role: ROLES.AGENT,
        }),
      ).rejects.toThrow(
        "Vous n'avez pas l'autorisation de supprimer cette collecte",
      );
    });

    it("allows a super admin to delete any collecte", async () => {
      const collecte = createCollecteDoc({
        agent: createUserRef("other-agent"),
      });
      const station = createStationDoc({ capaciteActuelle: 500 });

      mockCollecteModel.findById.mockResolvedValue(collecte);
      mockStationModel.findById.mockResolvedValue(station);
      mockCollecteModel.findByIdAndDelete.mockResolvedValue(collecte);

      const result = await collecteService.deleteCollecte("collecte-1", {
        id: "super-1",
        role: ROLES.SUPER_ADMIN,
      });

      expect(result.message).toMatch(/Collecte supprim/);
    });

    it("rejects missing collectes", async () => {
      mockCollecteModel.findById.mockResolvedValue(null);

      await expect(
        collecteService.deleteCollecte("collecte-404", {
          id: "admin-1",
          role: ROLES.ADMIN,
        }),
      ).rejects.toThrow(/Collecte non trouv/);
    });
  });

  describe("getGlobalStats", () => {
    it("returns global statistics for admin users", async () => {
      mockCollecteModel.aggregate.mockResolvedValueOnce([
        {
          dechet: { id: "dechet-1", nom: "Plastique", categorie: "Recyclable" },
          totalQuantite: 900,
          nombreCollectes: 3,
        },
      ]);
      mockCollecteModel.countDocuments.mockResolvedValue(3);
      mockCollecteModel.aggregate.mockResolvedValueOnce([
        { _id: null, total: 900 },
      ]);
      mockStationModel.countDocuments.mockResolvedValue(2);

      const result = await collecteService.getGlobalStats(
        { id: "admin-1", role: ROLES.ADMIN },
        { dateDebut: "2026-04-01", dateFin: "2026-04-30" },
      );

      expect(result.resume).toEqual({
        totalCollectes: 3,
        quantiteTotale: 900,
        stationsActives: 2,
      });
      expect(result.detailsParDechet).toEqual([
        {
          dechet: { id: "dechet-1", nom: "Plastique", categorie: "Recyclable" },
          totalQuantite: 900,
          nombreCollectes: 3,
        },
      ]);
    });

    it("rejects agent users", async () => {
      await expect(
        collecteService.getGlobalStats({ id: "agent-1", role: ROLES.AGENT }),
      ).rejects.toThrow("Vous n'avez pas l'autorisation pour cette action");
    });
  });

  describe("getStatsByStation", () => {
    it("returns station statistics for admins with a period", async () => {
      mockStationModel.findById.mockResolvedValue(
        createStationDoc({ _id: "station-1" }),
      );
      mockCollecteModel.aggregate
        .mockResolvedValueOnce([
          {
            dechet: { id: "dechet-1", nom: "Plastique", categorie: "Recyclable" },
            totalQuantite: 600,
            nombreCollectes: 2,
          },
        ])
        .mockResolvedValueOnce([{ _id: null, total: 600 }]);
      mockCollecteModel.countDocuments.mockResolvedValue(2);

      const result = await collecteService.getStatsByStation(
        "station-1",
        { id: "admin-1", role: ROLES.ADMIN },
        { dateDebut: "2026-04-01", dateFin: "2026-04-30" },
      );

      expect(result.station).toEqual(
        expect.objectContaining({
          id: "station-1",
          nom: "Centre-Ville",
        }),
      );
      expect(result.resume).toEqual({
        totalCollectes: 2,
        quantiteTotale: 600,
      });
      expect(mockCollecteModel.aggregate).toHaveBeenCalled();
    });

    it("rejects missing stations", async () => {
      mockStationModel.findById.mockResolvedValue(null);

      await expect(
        collecteService.getStatsByStation("station-404", {
          id: "admin-1",
          role: ROLES.ADMIN,
        }),
      ).rejects.toThrow(/Station non trouv/);
    });

    it("rejects agents", async () => {
      await expect(
        collecteService.getStatsByStation("station-1", {
          id: "agent-1",
          role: ROLES.AGENT,
        }),
      ).rejects.toThrow("Vous n'avez pas l'autorisation pour cette action");
    });
  });

  describe("getGlobalStats", () => {
    it("returns global statistics without a custom period", async () => {
      mockCollecteModel.aggregate
        .mockResolvedValueOnce([
          {
            dechet: { id: "dechet-1", nom: "Plastique", categorie: "Recyclable" },
            totalQuantite: 900,
            nombreCollectes: 3,
          },
        ])
        .mockResolvedValueOnce([{ _id: null, total: 900 }]);
      mockCollecteModel.countDocuments.mockResolvedValue(3);
      mockStationModel.countDocuments.mockResolvedValue(2);

      const result = await collecteService.getGlobalStats(
        { id: "admin-1", role: ROLES.ADMIN },
        null,
      );

      expect(result.periode).toEqual({
        dateDebut: "toutes",
        dateFin: "toutes",
      });
      expect(result.resume).toEqual({
        totalCollectes: 3,
        quantiteTotale: 900,
        stationsActives: 2,
      });
    });
  });
});
