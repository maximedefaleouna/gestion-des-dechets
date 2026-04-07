const jwt = require("jsonwebtoken");
const User = require("../users/user.model");
const logger = require("../../common/utils/logger");

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "dev-access-secret";
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const formatUserReference = (userReference) => {
  if (!userReference) {
    return null;
  }

  if (typeof userReference === "string") {
    return { id: userReference };
  }

  return {
    id: (userReference._id || userReference.id).toString(),
    nom: userReference.nom,
    prenom: userReference.prenom,
    email: userReference.email,
    role: userReference.role,
  };
};

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdBy: formatUserReference(user.createdBy),
  createdAt: user.createdAt ? user.createdAt.toISOString() : null,
  updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
});

const createAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
  );

const createRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      type: "refresh",
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN },
  );

const bootstrapSuperAdmin = async () => {
  const existingSuperAdmin = await User.findOne({ role: "SUPER_ADMIN" });

  if (existingSuperAdmin) {
    return existingSuperAdmin;
  }

  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    logger.warn(
      "JWT secrets are not fully configured. Falling back to development defaults.",
    );
  }

  const superAdminPayload = {
    nom: process.env.SUPER_ADMIN_NOM || "Super",
    prenom: process.env.SUPER_ADMIN_PRENOM || "Admin",
    email: (process.env.SUPER_ADMIN_EMAIL || "superadmin@recycletrack.local")
      .trim()
      .toLowerCase(),
    password: process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!",
    role: "SUPER_ADMIN",
    createdBy: null,
  };

  const superAdmin = await User.create(superAdminPayload);

  logger.info(`Bootstrap SUPER_ADMIN created with email ${superAdmin.email}`);

  return superAdmin;
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw createError("Email et mot de passe sont obligatoires", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password +refreshToken",
  );

  if (!user) {
    throw createError("Identifiants invalides", 401);
  }

  if (!user.isActive) {
    throw createError("Ce compte est desactive", 403);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw createError("Identifiants invalides", 401);
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();
  await user.populate("createdBy", "nom prenom email role");

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

const refreshUserToken = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw createError("Le refresh token est obligatoire", 400);
  }

  let payload;

  try {
    payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw createError("Refresh token invalide ou expire", 401);
  }

  const user = await User.findById(payload.sub).select("+refreshToken");

  if (!user || user.refreshToken !== refreshToken) {
    throw createError("Session invalide", 401);
  }

  if (!user.isActive) {
    throw createError("Ce compte est desactive", 403);
  }

  const newAccessToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken(user);

  user.refreshToken = newRefreshToken;
  await user.save();
  await user.populate("createdBy", "nom prenom email role");

  return {
    user: sanitizeUser(user),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logout = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw createError("Le refresh token est obligatoire", 400);
  }

  let payload;

  try {
    payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw createError("Refresh token invalide ou expire", 401);
  }

  const user = await User.findById(payload.sub).select("+refreshToken");

  if (!user || user.refreshToken !== refreshToken) {
    throw createError("Session invalide", 401);
  }

  if (!user.isActive) {
    throw createError("Ce compte est desactive", 403);
  }

  user.refreshToken = null;
  await user.save();
};

module.exports = {
  bootstrapSuperAdmin,
  login,
  logout,
  refreshUserToken,
};
