const express = require("express");
const {
  authenticateToken,
  authorizeRoles,
  ROLES,
} = require("../../common/utils/autorize");
const userController = require("./user.controller");
const userValidator = require("./user.validator");

const router = express.Router();

router.use(authenticateToken);

router.get("/me", userController.getMe);
router.patch(
  "/me",
  userValidator.validateUpdateUser,
  userValidator.validateRequest,
  userController.updateMe,
);

router.post(
  "/",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  userValidator.validateCreateUser,
  userValidator.validateRequest,
  userController.createUser,
);

router.get(
  "/",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  userController.getUsers,
);

router.get(
  "/:id",
  userValidator.validateObjectId,
  userValidator.validateRequest,
  userController.getUserById,
);

router.patch(
  "/:id",
  userValidator.validateObjectId,
  userValidator.validateUpdateUser,
  userValidator.validateRequest,
  userController.updateUser,
);

router.delete(
  "/:id",
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  userValidator.validateObjectId,
  userValidator.validateRequest,
  userController.deleteUser,
);

module.exports = router;
