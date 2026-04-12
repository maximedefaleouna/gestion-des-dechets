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
router.post("/", collecteController.createCollecte); // All authenticated users can create

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

// Read: all authenticated users
router.get("/:id", collecteController.getCollecteById);
// Update and Delete: ADMIN and SUPER_ADMIN only
router.patch("/:id", authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), collecteController.updateCollecte);
router.delete("/:id", authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), collecteController.deleteCollecte);

module.exports = router;
