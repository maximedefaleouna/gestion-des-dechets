const express = require("express");
const authController = require("./auth.controller");
const { authenticateToken } = require("../../common/utils/autorize");

const router = express.Router();

router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/change-password", authenticateToken, authController.changePassword);
router.post("/forgot-password/request", authController.requestPasswordReset);
router.post(
  "/forgot-password/verify",
  authController.verifyPasswordResetCode,
);
router.post("/forgot-password/reset", authController.resetPassword);

module.exports = router;
