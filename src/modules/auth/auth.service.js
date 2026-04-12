const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../users/user.model");
const PasswordResetCode = require("./auth.model");
const logger = require("../../common/utils/logger");

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "dev-access-secret";
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const DEFAULT_USER_PASSWORD = "123456";
const PASSWORD_RESET_CODE_TTL_MINUTES = 15;
const PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;

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

const hashValue = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

const generateVerificationCode = () =>
  crypto.randomInt(0, 1000000).toString().padStart(6, "0");

const generateResetToken = () => crypto.randomBytes(32).toString("hex");

const addMinutes = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

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
    updatedBy: null,
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

const changePassword = async (currentUser, payload) => {
  if (
    !payload.currentPassword ||
    !payload.newPassword ||
    !payload.confirmNewPassword
  ) {
    throw createError(
      "Ancien mot de passe, nouveau mot de passe et confirmation sont obligatoires",
      400,
    );
  }

  if (payload.newPassword !== payload.confirmNewPassword) {
    throw createError(
      "La confirmation du nouveau mot de passe ne correspond pas",
      400,
    );
  }

  const user = await User.findById(currentUser.id).select(
    "+password +refreshToken",
  );

  if (!user) {
    throw createError("Utilisateur introuvable", 404);
  }

  const isCurrentPasswordValid = await user.comparePassword(
    payload.currentPassword,
  );

  if (!isCurrentPasswordValid) {
    throw createError("Ancien mot de passe incorrect", 400);
  }

  user.password = payload.newPassword;
  user.refreshToken = null;
  await user.save();

  return {
    message: "Mot de passe modifie avec succes",
  };
};

const requestPasswordReset = async ({ email }) => {
  if (!email) {
    throw createError("L'email est obligatoire", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({
    email: normalizedEmail,
    isActive: true,
    deletedAt: null,
  });

  if (!user) {
    return {
      message:
        "Si un compte existe avec cet email, un code de verification a ete genere",
      data: {
        email: normalizedEmail,
        expiresAt: null,
        verificationCode: null,
      },
    };
  }

  const verificationCode = generateVerificationCode();
  const codeExpiresAt = addMinutes(PASSWORD_RESET_CODE_TTL_MINUTES);

  await PasswordResetCode.findOneAndUpdate(
    { user: user._id },
    {
      $set: {
        user: user._id,
        email: normalizedEmail,
        codeHash: hashValue(verificationCode),
        codeExpiresAt,
        codeAttempts: 0,
        verifiedAt: null,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        usedAt: null,
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  if (process.env.NODE_ENV !== "production") {
    logger.info({
      message: "Password reset code generated",
      email: normalizedEmail,
      code: verificationCode,
    });
  }

  return {
    message:
      "Si un compte existe avec cet email, un code de verification a ete genere",
    data: {
      email: normalizedEmail,
      expiresAt: codeExpiresAt.toISOString(),
      verificationCode:
        process.env.NODE_ENV === "production" ? null : verificationCode,
    },
  };
};

const verifyPasswordResetCode = async ({ email, code }) => {
  if (!email || !code) {
    throw createError(
      "L'email et le code de verification sont obligatoires",
      400,
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = String(code).trim();

  if (!/^\d{6}$/.test(normalizedCode)) {
    throw createError("Le code de verification doit contenir 6 chiffres", 400);
  }

  const resetEntry = await PasswordResetCode.findOne({
    email: normalizedEmail,
    usedAt: null,
  }).select("+codeHash +resetTokenHash");

  if (!resetEntry) {
    throw createError("Code de verification invalide ou expire", 400);
  }

  if (resetEntry.codeExpiresAt <= new Date()) {
    throw createError("Code de verification invalide ou expire", 400);
  }

  if (resetEntry.codeAttempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
    throw createError(
      "Code de verification bloque. Veuillez redemander un code",
      400,
    );
  }

  const isCodeValid = hashValue(normalizedCode) === resetEntry.codeHash;

  if (!isCodeValid) {
    resetEntry.codeAttempts += 1;
    await resetEntry.save();
    throw createError("Code de verification invalide", 400);
  }

  const resetToken = generateResetToken();
  resetEntry.verifiedAt = new Date();
  resetEntry.resetTokenHash = hashValue(resetToken);
  resetEntry.resetTokenExpiresAt = addMinutes(PASSWORD_RESET_TOKEN_TTL_MINUTES);
  resetEntry.codeAttempts = 0;
  await resetEntry.save();

  return {
    message: "Code de verification valide",
    data: {
      email: normalizedEmail,
      resetToken,
      expiresAt: resetEntry.resetTokenExpiresAt.toISOString(),
    },
  };
};

const resetPassword = async ({
  email,
  resetToken,
  newPassword,
  confirmNewPassword,
}) => {
  if (!email || !resetToken || !newPassword || !confirmNewPassword) {
    throw createError(
      "L'email, le token de reinitialisation, le nouveau mot de passe et sa confirmation sont obligatoires",
      400,
    );
  }

  if (newPassword !== confirmNewPassword) {
    throw createError(
      "La confirmation du nouveau mot de passe ne correspond pas",
      400,
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const resetEntry = await PasswordResetCode.findOne({
    email: normalizedEmail,
    usedAt: null,
  }).select("+resetTokenHash");

  if (!resetEntry) {
    throw createError("Session de reinitialisation invalide ou expiree", 400);
  }

  if (!resetEntry.verifiedAt) {
    throw createError("Veuillez d'abord verifier le code de verification", 400);
  }

  if (
    !resetEntry.resetTokenExpiresAt ||
    resetEntry.resetTokenExpiresAt <= new Date()
  ) {
    throw createError("Session de reinitialisation invalide ou expiree", 400);
  }

  if (hashValue(resetToken) !== resetEntry.resetTokenHash) {
    throw createError("Session de reinitialisation invalide ou expiree", 400);
  }

  const user = await User.findById(resetEntry.user).select(
    "+password +refreshToken",
  );

  if (!user || user.email !== normalizedEmail) {
    throw createError("Utilisateur introuvable", 404);
  }

  user.password = newPassword;
  user.refreshToken = null;
  await user.save();

  resetEntry.usedAt = new Date();
  resetEntry.resetTokenHash = null;
  await resetEntry.save();

  return {
    message: "Mot de passe reinitialise avec succes",
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
  changePassword,
  login,
  requestPasswordReset,
  logout,
  resetPassword,
  refreshUserToken,
  verifyPasswordResetCode,
};
