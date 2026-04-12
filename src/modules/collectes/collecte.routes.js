 const express = require("express");
const {
  authenticateToken,
  authorizeRoles,
  ROLES,
} = require("../../common/utils/autorize");
const collecteController = require("./collecte.controller");

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes de base
router.get("/", collecteController.getCollectes);
router.post("/", collecteController.createCollecte);

// Routes de statistiques (réservées aux ADMIN et SUPER_ADMIN)
router.get(
  "/stats/global",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  collecteController.getGlobalStats
);
router.get(
  "/stats/station/:stationId",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  collecteController.getStatsByStation
);

router.get("/:id", collecteController.getCollecteById);
router.patch("/:id", collecteController.updateCollecte);
router.delete("/:id", collecteController.deleteCollecte);

module.exports = router;
