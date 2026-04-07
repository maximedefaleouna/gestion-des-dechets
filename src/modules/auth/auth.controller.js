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

module.exports = {
  login,
  logout,
  refreshToken,
};
