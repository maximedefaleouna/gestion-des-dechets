const express = require("express");
const {
  authenticateToken,
  authorizeRoles,
  ROLES,
} = require("../../common/utils/autorize");
const rapportController = require("./rapport.controller");

const router = express.Router();

router.use(authenticateToken);

// Allow all authenticated users (ADMIN, SUPER_ADMIN, AGENT)
router.get(
  "/dashboard",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.AGENT),
  rapportController.getDashboard,
);

// Allow all authenticated users (ADMIN, SUPER_ADMIN, AGENT)
router.get(
  "/statistiques",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.AGENT),
  rapportController.getStatistiques,
);

module.exports = router;
