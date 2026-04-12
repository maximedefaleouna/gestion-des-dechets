const express = require("express");
const dechetController = require("./dechet.controller");
const dechetValidator = require("./dechet.validator");
const {
  authenticateToken,
  authorizeRoles,
  ROLES,
} = require("../../common/utils/autorize");

const router = express.Router();

router.use(authenticateToken);

router.get("/", dechetController.getDechets);
router.get(
  "/:id",
  dechetValidator.validateObjectId,
  dechetValidator.validateRequest,
  dechetController.getDechetById,
);
router.post(
  "/",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  dechetValidator.validateCreateDechet,
  dechetValidator.validateRequest,
  dechetController.createDechet,
);
router.put(
  "/:id",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  dechetValidator.validateUpdateDechet,
  dechetValidator.validateRequest,
  dechetController.updateDechet,
);
router.delete(
  "/:id",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  dechetValidator.validateObjectId,
  dechetValidator.validateRequest,
  dechetController.deleteDechet,
);

module.exports = router;
