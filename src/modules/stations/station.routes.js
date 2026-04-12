const express = require("express");
const stationController = require("./station.controller");
const stationValidator = require("./station.validator");
const {
  authenticateToken,
  authorizeRoles,
  ROLES,
} = require("../../common/utils/autorize");

const router = express.Router();

router.use(authenticateToken);
router.get("/", stationController.getStations);
router.get(
  "/:id",
  stationValidator.validateGetStation,
  stationValidator.validateRequest,
  stationController.getStation,
);
router.post(
  "/",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  stationValidator.validateCreateStation,
  stationValidator.validateRequest,
  stationController.createStation,
);
router.put(
  "/:id",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  stationValidator.validateUpdateStation,
  stationValidator.validateRequest,
  stationController.updateStation,
);
router.delete(
  "/:id",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  stationValidator.validateDeleteStation,
  stationValidator.validateRequest,
  stationController.deleteStation,
);

module.exports = router;
