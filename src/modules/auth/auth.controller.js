const authService = require("./auth.service");

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({
      message: "Connexion reussie",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshUserToken(req.body);
    res.status(200).json({
      message: "Token rafraichi",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body);
    res.status(200).json({
      message: "Deconnexion reussie",
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const result = await authService.requestPasswordReset(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const verifyPasswordResetCode = async (req, res, next) => {
  try {
    const result = await authService.verifyPasswordResetCode(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  changePassword,
  requestPasswordReset,
  login,
  logout,
  resetPassword,
  refreshToken,
  verifyPasswordResetCode,
};
