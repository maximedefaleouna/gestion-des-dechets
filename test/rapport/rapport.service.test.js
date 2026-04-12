const mockCollecteModel = {
  aggregate: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
};

const mockStationModel = {
  countDocuments: jest.fn(),
};

const mockUserModel = {
  countDocuments: jest.fn(),
};

jest.mock("../../src/modules/collectes/collecte.model", () => mockCollecteModel);
jest.mock("../../src/modules/stations/station.model", () => mockStationModel);
jest.mock("../../src/modules/users/user.model", () => mockUserModel);

const { ROLES } = require("../../src/common/utils/autorize");
const rapportService = require("../../src/modules/rapport/rapport.service");

const createQueryResult = (value) => {
  const query = {
    populate: jest.fn(() => query),
    sort: jest.fn(() => query),
    limit: jest.fn(() => query),
    then: (resolve) => Promise.resolve(resolve(value)),
  };

  return query;
};

describe("rapport.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds the report statistics for a period", async () => {
    mockCollecteModel.aggregate
      .mockResolvedValueOnce([{ totalQuantite: 3900, totalCollectes: 10 }])
      .mockResolvedValueOnce([
        { _id: { year: 2026, month: 3 }, quantiteKg: 1800 },
        { _id: { year: 2026, month: 4 }, quantiteKg: 2100 },
      ])
      .mockResolvedValueOnce([
        {
          stationId: "station-1",
          nom: "Centre-Ville",
          ville: "Lome",
          quantiteKg: 1600,
          nombreCollectes: 4,
        },
        {
          stationId: "station-2",
          nom: "Confluence",
          ville: "Lome",
          quantiteKg: 1200,
          nombreCollectes: 3,
        },
      ])
      .mockResolvedValueOnce([
        {
          dechetId: "dechet-1",
          nom: "Plastique",
          categorie: "Recyclable",
          quantiteKg: 740,
          nombreCollectes: 3,
        },
        {
          dechetId: "dechet-2",
          nom: "Verre",
          categorie: "Recyclable",
          quantiteKg: 1110,
          nombreCollectes: 4,
        },
      ])
      .mockResolvedValueOnce([{ _id: null, total: 3000 }]);
    mockCollecteModel.countDocuments.mockResolvedValue(10);
    mockStationModel.countDocuments.mockResolvedValue(6);

    const result = await rapportService.buildRapportData({
      dateDebut: "2026-03-01",
      dateFin: "2026-04-30",
    });

    expect(result.periode).toEqual({
      dateDebut: "2026-03-01T00:00:00.000Z",
      dateFin: "2026-04-30T00:00:00.000Z",
    });
    expect(result.resume).toEqual({
      totalRecycleKg: 3900,
      totalRecycleTonne: 3.9,
      moyenneParCollecteKg: 390,
      tauxRecyclage: 77,
      meilleureStation: {
        stationId: "station-1",
        nom: "Centre-Ville",
        ville: "Lome",
        quantiteKg: 1600,
      },
      totalCollectes: 10,
      stationsActives: 6,
    });
    expect(result.evolutionMensuelle).toEqual([
      {
        mois: "Mar",
        annee: 2026,
        quantiteKg: 1800,
      },
      {
        mois: "Avr",
        annee: 2026,
        quantiteKg: 2100,
      },
    ]);
    expect(result.collecteParStation).toEqual([
      {
        stationId: "station-1",
        nom: "Centre-Ville",
        ville: "Lome",
        quantiteKg: 1600,
        nombreCollectes: 4,
      },
      {
        stationId: "station-2",
        nom: "Confluence",
        ville: "Lome",
        quantiteKg: 1200,
        nombreCollectes: 3,
      },
    ]);
    expect(result.repartitionParTypeDechet).toEqual([
      {
        dechetId: "dechet-1",
        nom: "Plastique",
        categorie: "Recyclable",
        quantiteKg: 740,
        nombreCollectes: 3,
      },
      {
        dechetId: "dechet-2",
        nom: "Verre",
        categorie: "Recyclable",
        quantiteKg: 1110,
        nombreCollectes: 4,
      },
    ]);
  });

  it("builds the dashboard using the last six months by default", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-12T10:00:00.000Z"));

    try {
      mockCollecteModel.aggregate.mockResolvedValue([]);
      mockCollecteModel.countDocuments.mockResolvedValue(0);
      mockCollecteModel.find.mockReturnValue(createQueryResult([]));
      mockStationModel.countDocuments
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(4);
      mockUserModel.countDocuments
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(9);

      const result = await rapportService.getRapportDashboard(
        { id: "admin-1", role: ROLES.ADMIN },
        null,
      );

      expect(result.periode).toEqual({
        dateDebut: "2025-11-01T00:00:00.000Z",
        dateFin: "2026-04-12T10:00:00.000Z",
      });
      expect(result.collectesMensuelles.labels).toEqual([
        "Nov",
        "Dec",
        "Jan",
        "Fev",
        "Mar",
        "Avr",
      ]);
      expect(result.cartes.stationsActives).toEqual({
        valeur: 4,
        total: 6,
        pourcentage: 67,
      });
      expect(result.cartes.totalCollecte).toEqual({
        valeurKg: 0,
        valeurTonne: 0,
        libelle: "Ce mois",
        variationPourcent: 0,
      });
      expect(result.collectesRecentes).toEqual([]);
    } finally {
      jest.useRealTimers();
    }
  });

  it("builds the report using the default period when no range is provided", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-12T10:00:00.000Z"));

    try {
      mockCollecteModel.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockCollecteModel.countDocuments.mockResolvedValue(0);
      mockStationModel.countDocuments.mockResolvedValue(0);

      const result = await rapportService.buildRapportData(null);

      expect(result.periode).toEqual({
        dateDebut: "2025-10-01T00:00:00.000Z",
        dateFin: "2026-03-31T23:59:59.999Z",
      });
      expect(result.resume).toEqual({
        totalRecycleKg: 0,
        totalRecycleTonne: 0,
        moyenneParCollecteKg: 0,
        tauxRecyclage: 0,
        meilleureStation: null,
        totalCollectes: 0,
        stationsActives: 0,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it("rejects invalid report periods", async () => {
    await expect(
      rapportService.buildRapportData({
        dateDebut: "not-a-date",
        dateFin: "2026-04-30",
      }),
    ).rejects.toMatchObject({
      message: "La date de debut du rapport est invalide",
      statusCode: 400,
    });

    await expect(
      rapportService.buildRapportData({
        dateDebut: "2026-05-01",
        dateFin: "2026-04-30",
      }),
    ).rejects.toMatchObject({
      message: "La date de debut du rapport doit etre anterieure a la date de fin",
      statusCode: 400,
    });
  });

  it("builds the dashboard with custom data and an Autres series", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-12T10:00:00.000Z"));

    try {
      mockCollecteModel.aggregate
        .mockResolvedValueOnce([{ totalQuantiteKg: 6000, totalCollectes: 30 }])
        .mockResolvedValueOnce([{ totalQuantiteKg: 100, totalCollectes: 2 }])
        .mockResolvedValueOnce([{ totalQuantiteKg: 50, totalCollectes: 1 }])
        .mockResolvedValueOnce([{ totalQuantiteKg: 20, totalCollectes: 2 }])
        .mockResolvedValueOnce([{ totalQuantiteKg: 10, totalCollectes: 1 }])
        .mockResolvedValueOnce([
          { dechetId: "dechet-1", nom: "Papier", categorie: "Recyclable", quantiteKg: 2000, nombreCollectes: 8 },
          { dechetId: "dechet-2", nom: "Verre", categorie: "Recyclable", quantiteKg: 1500, nombreCollectes: 6 },
          { dechetId: "dechet-3", nom: "Metal", categorie: "Recyclable", quantiteKg: 1100, nombreCollectes: 5 },
          { dechetId: "dechet-4", nom: "Plastique", categorie: "Recyclable", quantiteKg: 900, nombreCollectes: 4 },
          { dechetId: "dechet-5", nom: "Textile", categorie: "Non recyclable", quantiteKg: 300, nombreCollectes: 2 },
          { dechetId: "dechet-6", nom: "Bois", categorie: "Non recyclable", quantiteKg: 200, nombreCollectes: 1 },
        ])
        .mockResolvedValueOnce([
          { year: 2026, month: 1, dechetId: "dechet-1", nom: "Papier", categorie: "Recyclable", quantiteKg: 500, nombreCollectes: 2 },
          { year: 2026, month: 2, dechetId: "dechet-6", nom: "Bois", categorie: "Non recyclable", quantiteKg: 150, nombreCollectes: 1 },
          { year: 2026, month: 4, dechetId: "dechet-2", nom: "Verre", categorie: "Recyclable", quantiteKg: 80, nombreCollectes: 1 },
        ]);
      mockCollecteModel.find.mockReturnValue(
        createQueryResult([
          {
            _id: "collecte-1",
            station: { _id: "station-1", nom: "Centre-Ville", ville: "Lome" },
            agent: { _id: "agent-1", nom: "Doe", prenom: "Jane" },
            dechet: { _id: "dechet-1", nom: "Papier", categorie: "Recyclable" },
            quantite: 100,
            dateCollecte: new Date("2026-03-10T10:00:00.000Z"),
            statut: "VALIDEE",
          },
        ]),
      );
      mockCollecteModel.countDocuments.mockResolvedValue(30);
      mockStationModel.countDocuments
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);
      mockUserModel.countDocuments
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(9);

      const result = await rapportService.getRapportDashboard(
        { id: "admin-1", role: ROLES.ADMIN },
        {
          dateDebut: "2026-01-01",
          dateFin: "2026-03-31",
        },
      );

      expect(result.collectesMensuelles.series).toHaveLength(6);
      expect(result.collectesMensuelles.series.at(-1).nom).toBe("Autres");
      expect(result.cartes.totalCollecte.variationPourcent).toBe(100);
      expect(result.cartes.collectes.variationPourcent).toBe(100);
      expect(result.collectesRecentes).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("returns report statistics for admins", async () => {
    mockCollecteModel.aggregate
      .mockResolvedValueOnce([{ totalQuantite: 1200, totalCollectes: 4 }])
      .mockResolvedValueOnce([{ _id: { year: 2026, month: 4 }, quantiteKg: 1200 }])
      .mockResolvedValueOnce([{ stationId: "station-1", nom: "Centre-Ville", ville: "Lome", quantiteKg: 1200, nombreCollectes: 4 }])
      .mockResolvedValueOnce([{ dechetId: "dechet-1", nom: "Papier", categorie: "Recyclable", quantiteKg: 1200, nombreCollectes: 4 }])
      .mockResolvedValueOnce([{ _id: null, total: 1200 }]);
    mockCollecteModel.countDocuments.mockResolvedValue(4);
    mockStationModel.countDocuments.mockResolvedValue(2);

    const result = await rapportService.getRapportStatistiques(
      { id: "admin-1", role: ROLES.ADMIN },
      { dateDebut: "2026-04-01", dateFin: "2026-04-30" },
    );

    expect(result.resume.totalRecycleKg).toBe(1200);
  });

  it("rejects agents for dashboard access", async () => {
    await expect(
      rapportService.getRapportDashboard({ id: "agent-1", role: ROLES.AGENT }),
    ).rejects.toMatchObject({
      message: "Vous n'avez pas l'autorisation pour consulter le tableau de bord",
      statusCode: 403,
    });
  });

  it("rejects agents for report statistics", async () => {
    await expect(
      rapportService.getRapportStatistiques({ id: "agent-1", role: ROLES.AGENT }),
    ).rejects.toMatchObject({
      message: "Vous n'avez pas l'autorisation pour consulter les rapports",
      statusCode: 403,
    });
  });
});
