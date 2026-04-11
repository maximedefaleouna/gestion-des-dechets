const stationService = require("./station.service");

const createStation = async (req, res, next) => {
  try {
    const station = await stationService.create(req.body);
    res.status(201).json({
      message: "Station creee avec succes",
      data: station,
    });
  } catch (error) {
    next(error);
  }
};

const getStations = async (req, res, next) => {
  try {
    const stations = await stationService.getAll();
    res.status(200).json({
      message: "Liste des stations",
      data: stations,
    });
  } catch (error) {
    next(error);
  }
};

const getStation = async (req, res, next) => {
  try {
    const station = await stationService.getById(req.params.id);
    res.status(200).json({
      message: "Station recuperee avec succes",
      data: station,
    });
  } catch (error) {
    next(error);
  }
};

const updateStation = async (req, res, next) => {
  try {
    const station = await stationService.updateById(req.params.id, req.body);
    res.status(200).json({
      message: "Station mise a jour avec succes",
      data: station,
    });
  } catch (error) {
    next(error);
  }
};

const deleteStation = async (req, res, next) => {
  try {
    const station = await stationService.deleteById(req.params.id);
    res.status(200).json({
      message: "Station supprimee avec succes",
      data: station,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStation,
  deleteStation,
  getStation,
  getStations,
  updateStation,
};
