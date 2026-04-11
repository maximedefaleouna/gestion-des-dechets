const dechetService = require("./dechet.service");

const createDechet = async (req, res, next) => {
  try {
    const dechet = await dechetService.createDechet(req.body);
    res.status(201).json({
      message: "Dechet cree avec succes",
      data: dechet,
    });
  } catch (error) {
    next(error);
  }
};

const getDechets = async (req, res, next) => {
  try {
    const dechets = await dechetService.getAllDechets();
    res.status(200).json({
      message: "Liste des dechets",
      data: dechets,
    });
  } catch (error) {
    next(error);
  }
};
const getDechetById = async (req, res, next) => {
  try {
    const dechet = await dechetService.getDechetById(req.params.id);
    res.status(200).json({
      message: "Dechet recupere avec succes",
      data: dechet,
    });
  } catch (error) {
    next(error);
  }
};
const updateDechet = async (req, res, next) => {
  try {
    const dechet = await dechetService.updateDechet(req.params.id, req.body);
    res.status(200).json({
      message: "Dechet mis a jour avec succes",
      data: dechet,
    });
  } catch (error) {
    next(error);
  }
};
const deleteDechet = async (req, res, next) => {
  try {
    const dechet = await dechetService.deleteDechet(req.params.id);
    res.status(200).json({
      message: "Dechet supprime avec succes",
      data: dechet,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDechet,
  getDechets,
  getDechetById,
  updateDechet,
  deleteDechet,
};
