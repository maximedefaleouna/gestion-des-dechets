const express = require("express");
const {
  authenticateToken,
  authorizeRoles,
  ROLES,
} = require("../../common/utils/autorize");
const rapportController = require("./rapport.controller");

const router = express.Router();

router.use(authenticateToken);

router.get(
  "/dashboard",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  rapportController.getDashboard,
);

router.get(
  "/statistiques",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  rapportController.getStatistiques,
);

module.exports = router;
