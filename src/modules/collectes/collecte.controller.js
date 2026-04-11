 const collecteService = require("./collecte.service");

const createCollecte = async (req, res, next) => {
  try {
    const collecte = await collecteService.createCollecte(req.body, req.user);
    res.status(201).json({
      message: "Collecte créée avec succès",
      data: collecte,
    });
  } catch (error) {
    next(error);
  }
};

const getCollectes = async (req, res, next) => {
  try {
    const result = await collecteService.getCollectes(req.query, req.user);
    res.status(200).json({
      message: "Liste des collectes",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getCollecteById = async (req, res, next) => {
  try {
    const collecte = await collecteService.getCollecteById(req.params.id, req.user);
    res.status(200).json({
      message: "Collecte récupérée avec succès",
      data: collecte,
    });
  } catch (error) {
    next(error);
  }
};

const updateCollecte = async (req, res, next) => {
  try {
    const collecte = await collecteService.updateCollecte(req.params.id, req.body, req.user);
    res.status(200).json({
      message: "Collecte mise à jour avec succès",
      data: collecte,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCollecte = async (req, res, next) => {
  try {
    const result = await collecteService.deleteCollecte(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getStatsByStation = async (req, res, next) => {
  try {
    const period = req.query.dateDebut && req.query.dateFin ? {
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin,
    } : null;
    const stats = await collecteService.getStatsByStation(req.params.stationId, req.user, period);
    res.status(200).json({
      message: "Statistiques de la station",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getGlobalStats = async (req, res, next) => {
  try {
    const period = req.query.dateDebut && req.query.dateFin ? {
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin,
    } : null;
    const stats = await collecteService.getGlobalStats(req.user, period);
    res.status(200).json({
      message: "Statistiques globales",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCollecte,
  deleteCollecte,
  getCollecteById,
  getCollectes,
  getGlobalStats,
  getStatsByStation,
  updateCollecte,
};