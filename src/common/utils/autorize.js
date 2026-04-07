const jwt = require("jsonwebtoken");
const User = require("../../modules/users/user.model");

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "dev-access-secret";

const ROLES = {
  AGENT: "AGENT",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
};

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const extractToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const authenticateToken = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      throw createError("Token d'acces manquant ou invalide", 401);
    }

    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.sub).select("email role isActive");

    if (!user) {
      throw createError("Utilisateur introuvable", 401);
    }

    if (!user.isActive) {
      throw createError("Ce compte est desactive", 403);
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(
      error.statusCode
        ? error
        : createError("Token d'acces invalide ou expire", 401),
    );
  }
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(createError("Utilisateur non authentifie", 401));
  }

  if (req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      createError("Vous n'avez pas l'autorisation pour cette action", 403),
    );
  }

  return next();
};

module.exports = {
  ROLES,
  authenticateToken,
  authorizeRoles,
};
