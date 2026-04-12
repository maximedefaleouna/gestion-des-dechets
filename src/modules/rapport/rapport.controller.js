const rapportService = require("./rapport.service");

const getStatistiques = async (req, res, next) => {
  try {
    const period =
      req.query.dateDebut && req.query.dateFin
        ? {
            dateDebut: req.query.dateDebut,
            dateFin: req.query.dateFin,
          }
        : null;

    const data = await rapportService.getRapportStatistiques(
      req.user,
      period,
    );

    res.status(200).json({
      message: "Statistiques du rapport recuperees avec succes",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const period =
      req.query.dateDebut && req.query.dateFin
        ? {
            dateDebut: req.query.dateDebut,
            dateFin: req.query.dateFin,
          }
        : null;

    const data = await rapportService.getRapportDashboard(req.user, period);

    res.status(200).json({
      message: "Tableau de bord recupere avec succes",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getStatistiques,
};
