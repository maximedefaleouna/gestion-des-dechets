const mockStationService = {
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
};

jest.mock("../../src/modules/stations/station.service", () => mockStationService);

const stationController = require("../../src/modules/stations/station.controller");

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("station.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a station", async () => {
    const req = { body: { nom: "Centre-Ville" } };
    const res = createRes();
    const next = jest.fn();

    mockStationService.create.mockResolvedValue({ id: "station-1" });

    await stationController.createStation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Station creee avec succes",
      data: { id: "station-1" },
    });
  });

  it("forwards create errors", async () => {
    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockStationService.create.mockRejectedValue(error);

    await stationController.createStation(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("returns the stations list", async () => {
    const req = {};
    const res = createRes();
    const next = jest.fn();

    mockStationService.getAll.mockResolvedValue([{ id: "station-1" }]);

    await stationController.getStations(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Liste des stations",
      data: [{ id: "station-1" }],
    });
  });

  it("returns a station by id", async () => {
    const req = { params: { id: "station-1" } };
    const res = createRes();
    const next = jest.fn();

    mockStationService.getById.mockResolvedValue({ id: "station-1" });

    await stationController.getStation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Station recuperee avec succes",
      data: { id: "station-1" },
    });
  });

  it("updates a station", async () => {
    const req = { params: { id: "station-1" }, body: { nom: "Centre" } };
    const res = createRes();
    const next = jest.fn();

    mockStationService.updateById.mockResolvedValue({ id: "station-1" });

    await stationController.updateStation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Station mise a jour avec succes",
      data: { id: "station-1" },
    });
  });

  it("deletes a station", async () => {
    const req = { params: { id: "station-1" } };
    const res = createRes();
    const next = jest.fn();

    mockStationService.deleteById.mockResolvedValue({ acknowledged: true });

    await stationController.deleteStation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Station supprimee avec succes",
      data: { acknowledged: true },
    });
  });

  it("forwards read errors", async () => {
    const req = { params: { id: "station-404" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("Station non trouvee");

    mockStationService.getById.mockRejectedValue(error);

    await stationController.getStation(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("forwards update errors", async () => {
    const req = { params: { id: "station-1" }, body: { nom: "Centre" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockStationService.updateById.mockRejectedValue(error);

    await stationController.updateStation(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("forwards delete errors", async () => {
    const req = { params: { id: "station-1" } };
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockStationService.deleteById.mockRejectedValue(error);

    await stationController.deleteStation(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("forwards list errors", async () => {
    const req = {};
    const res = createRes();
    const next = jest.fn();
    const error = new Error("boom");

    mockStationService.getAll.mockRejectedValue(error);

    await stationController.getStations(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
