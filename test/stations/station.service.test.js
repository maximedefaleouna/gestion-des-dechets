const mockStationModel = jest.fn();
mockStationModel.find = jest.fn();
mockStationModel.findOne = jest.fn();
mockStationModel.findById = jest.fn();
mockStationModel.findOneAndUpdate = jest.fn();
mockStationModel.updateOne = jest.fn();

jest.mock("../../src/modules/stations/station.model", () => mockStationModel);

const stationService = require("../../src/modules/stations/station.service");

const createStationDoc = (overrides = {}) => ({
  _id: "station-1",
  nom: "Centre-Ville",
  adresse: "Rue 1",
  ville: "Lome",
  capaciteMax: 1000,
  capaciteActuelle: 250,
  typesDechetsAcceptes: ["dechet-1"],
  localisation: {
    latitude: 6.13,
    longitude: 1.22,
  },
  statut: "ACTIVE",
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("station.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStationModel.mockImplementation((data) => createStationDoc(data));
  });

  it("creates a station", async () => {
    const payload = {
      nom: "Centre-Ville",
      adresse: "Rue 1",
      ville: "Lome",
      capaciteMax: 1000,
      typesDechetsAcceptes: ["dechet-1"],
      localisation: { latitude: 6.13, longitude: 1.22 },
    };

    const stationDoc = createStationDoc({ ...payload });
    stationDoc.save = jest.fn().mockResolvedValue(stationDoc);
    mockStationModel.mockImplementationOnce(() => stationDoc);

    const result = await stationService.create(payload);

    expect(result).toBe(stationDoc);
    expect(mockStationModel).toHaveBeenCalledWith(payload);
    expect(stationDoc.save).toHaveBeenCalledTimes(1);
  });

  it("returns all stations", async () => {
    const stations = [createStationDoc({ _id: "station-2", nom: "Confluence" })];
    mockStationModel.find.mockResolvedValue(stations);

    await expect(stationService.getAll()).resolves.toBe(stations);
  });

  it("returns a station by id", async () => {
    const station = createStationDoc({ _id: "station-2" });
    mockStationModel.findOne.mockResolvedValue(station);

    await expect(stationService.getById("station-2")).resolves.toBe(station);
  });

  it("rejects unknown stations when reading by id", async () => {
    mockStationModel.findOne.mockResolvedValue(null);

    await expect(stationService.getById("station-404")).rejects.toThrow(
      "Station non trouvee",
    );
  });

  it("updates a station", async () => {
    const updatedStation = createStationDoc({
      _id: "station-2",
      nom: "Centre-Ville Renforce",
    });
    mockStationModel.findOneAndUpdate.mockResolvedValue(updatedStation);

    await expect(
      stationService.updateById("station-2", { nom: "Centre-Ville Renforce" }),
    ).resolves.toBe(updatedStation);
    expect(mockStationModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: "station-2",
        isDeleted: { $ne: true },
      },
      {
        $set: {
          nom: "Centre-Ville Renforce",
        },
      },
      { new: true, runValidators: true },
    );
  });

  it("rejects unknown station updates", async () => {
    mockStationModel.findOneAndUpdate.mockResolvedValue(null);

    await expect(
      stationService.updateById("station-404", { nom: "Centre-Ville" }),
    ).rejects.toMatchObject({
      message: "Station non trouvee",
      statusCode: 404,
    });
  });

  it("soft-deletes a station", async () => {
    const deletedStation = createStationDoc({
      _id: "station-2",
      isDeleted: true,
    });
    mockStationModel.findOneAndUpdate.mockResolvedValue(deletedStation);

    await expect(stationService.deleteById("station-2")).resolves.toBe(
      deletedStation,
    );
    expect(mockStationModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: "station-2",
        isDeleted: { $ne: true },
      },
      {
        $set: expect.objectContaining({
          isDeleted: true,
          deletedAt: expect.any(Date),
          deletedBy: null,
        }),
      },
      { new: true },
    );
  });

  it("rejects unknown station deletions", async () => {
    mockStationModel.findOneAndUpdate.mockResolvedValue(null);

    await expect(stationService.deleteById("station-404")).rejects.toMatchObject({
      message: "Station non trouvee",
      statusCode: 404,
    });
  });
});
