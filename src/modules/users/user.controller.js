const userService = require("./user.service");

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.user);
    res.status(201).json({
      message: "Utilisateur cree avec succes",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const result = await userService.getUsers(req.query);
    res.status(200).json({
      message: "Liste des utilisateurs",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id, req.user);
    res.status(200).json({
      message: "Utilisateur recupere avec succes",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await userService.getCurrentUser(req.user);
    res.status(200).json({
      message: "Profil utilisateur",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user);
    res.status(200).json({
      message: "Utilisateur mis a jour avec succes",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.user.id, req.body, req.user);
    res.status(200).json({
      message: "Profil mis a jour avec succes",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  deleteUser,
  getMe,
  getUserById,
  getUsers,
  updateMe,
  updateUser,
};
