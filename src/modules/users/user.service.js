const User = require("./user.model");
const { ROLES } = require("../../common/utils/autorize");

const DEFAULT_USER_PASSWORD = "123456";

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
  deletedBy: formatUserReference(user.deletedBy),
  deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
  createdAt: user.createdAt ? user.createdAt.toISOString() : null,
  updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
});

const buildSearchFilter = (search) => {
  if (!search) {
    return {};
  }

  return {
    $or: [
      { nom: { $regex: search, $options: "i" } },
      { prenom: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ],
  };
};

const canAccessOwnResource = (currentUser, userId) =>
  currentUser &&
  currentUser.role === ROLES.AGENT &&
  currentUser.id.toString() === userId.toString();

const assertCanReadUser = (currentUser, targetUser) => {
  if (currentUser.role === ROLES.SUPER_ADMIN) {
    return;
  }

  if (currentUser.role === ROLES.ADMIN && targetUser.role !== ROLES.SUPER_ADMIN) {
    return;
  }

  if (canAccessOwnResource(currentUser, targetUser._id)) {
    return;
  }

  throw createError("Vous n'avez pas l'autorisation de consulter cet utilisateur", 403);
};

const assertCanManageUser = (currentUser, targetUser) => {
  if (currentUser.role === ROLES.SUPER_ADMIN) {
    return;
  }

  if (currentUser.role === ROLES.ADMIN && targetUser.role !== ROLES.SUPER_ADMIN) {
    return;
  }

  throw createError("Vous n'avez pas l'autorisation de modifier cet utilisateur", 403);
};

const assertRoleAssignmentAllowed = (currentUser, role) => {
  if (!role) {
    return;
  }

  if (currentUser.role === ROLES.SUPER_ADMIN) {
    return;
  }

  if (currentUser.role === ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) {
    return;
  }

  throw createError("Vous ne pouvez pas attribuer ce role", 403);
};

const assertLastSuperAdminNotDisabled = async (targetUser, nextRole, nextIsActive) => {
  const disablesSuperAdmin =
    targetUser.role === ROLES.SUPER_ADMIN &&
    (nextRole && nextRole !== ROLES.SUPER_ADMIN
      ? true
      : nextIsActive === false);

  if (!disablesSuperAdmin) {
    return;
  }

  const activeSuperAdmins = await User.countDocuments({
    role: ROLES.SUPER_ADMIN,
    isActive: true,
  });

  if (activeSuperAdmins <= 1) {
    throw createError("Impossible de desactiver le dernier SUPER_ADMIN", 400);
  }
};

const getUsers = async (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const includeInactive = query.includeInactive === "true";
  const allowedSortFields = ["nom", "prenom", "email", "role", "createdAt", "updatedAt"];
  const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : "createdAt";
  const sortOrder = query.order === "asc" ? 1 : -1;

  const filters = {
    ...buildSearchFilter(query.search),
  };

  if (query.role) {
    filters.role = query.role;
  }

  if (!includeInactive) {
    filters.isActive = true;
  }

  const [users, total] = await Promise.all([
    User.find(filters)
      .populate("createdBy", "nom prenom email role")
      .populate("deletedBy", "nom prenom email role")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filters),
  ]);

  return {
    data: users.map(sanitizeUser),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getUserById = async (userId, currentUser) => {
  const user = await User.findById(userId)
    .populate("createdBy", "nom prenom email role")
    .populate("deletedBy", "nom prenom email role");

  if (!user) {
    throw createError("Utilisateur introuvable", 404);
  }

  assertCanReadUser(currentUser, user);

  return sanitizeUser(user);
};

const getCurrentUser = async (currentUser) => {
  return getUserById(currentUser.id, currentUser);
};

const createUser = async (payload, currentUser) => {
  assertRoleAssignmentAllowed(currentUser, payload.role);

  const email = payload.email.trim().toLowerCase();
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw createError("Un utilisateur avec cet email existe deja", 409);
  }

  const user = await User.create({
    nom: payload.nom,
    prenom: payload.prenom,
    email,
    password: payload.password || DEFAULT_USER_PASSWORD,
    role: payload.role || ROLES.AGENT,
    createdBy: currentUser.id,
    updatedBy: currentUser.id,
  });

  const createdUser = await User.findById(user._id).populate(
    "createdBy",
    "nom prenom email role",
  );

  return sanitizeUser(createdUser);
};

const updateUser = async (userId, payload, currentUser) => {
  const user = await User.findById(userId).select("+password +refreshToken");

  if (!user) {
    throw createError("Utilisateur introuvable", 404);
  }

  if (currentUser.role === ROLES.AGENT && currentUser.id.toString() !== userId.toString()) {
    throw createError("Vous ne pouvez modifier que votre propre compte", 403);
  }

  if (currentUser.role !== ROLES.AGENT) {
    assertCanManageUser(currentUser, user);
  }

  if (payload.role) {
    assertRoleAssignmentAllowed(currentUser, payload.role);
    await assertLastSuperAdminNotDisabled(user, payload.role, payload.isActive);
    user.role = payload.role;
  }

  if (payload.email && payload.email.trim().toLowerCase() !== user.email) {
    const existingUser = await User.findOne({
      email: payload.email.trim().toLowerCase(),
      _id: { $ne: user._id },
    });

    if (existingUser) {
      throw createError("Un utilisateur avec cet email existe deja", 409);
    }

    user.email = payload.email.trim().toLowerCase();
  }

  if (payload.nom) {
    user.nom = payload.nom;
  }

  if (payload.prenom) {
    user.prenom = payload.prenom;
  }

  if (payload.password) {
    user.password = payload.password;
  }

  user.updatedBy = currentUser.id;

  if (typeof payload.isActive === "boolean") {
    if (currentUser.role === ROLES.AGENT) {
      throw createError("Vous ne pouvez pas changer le statut du compte", 403);
    }

    await assertLastSuperAdminNotDisabled(user, payload.role, payload.isActive);

    user.isActive = payload.isActive;
    user.deletedAt = payload.isActive ? null : new Date();
    user.deletedBy = payload.isActive ? null : currentUser.id;

    if (!payload.isActive) {
      user.refreshToken = null;
    }
  }

  await user.save();

  const updatedUser = await User.findById(user._id)
    .populate("createdBy", "nom prenom email role")
    .populate("deletedBy", "nom prenom email role");

  return sanitizeUser(updatedUser);
};

const deleteUser = async (userId, currentUser) => {
  const user = await User.findById(userId).select("+refreshToken");

  if (!user) {
    throw createError("Utilisateur introuvable", 404);
  }

  assertCanManageUser(currentUser, user);
  await assertLastSuperAdminNotDisabled(user, null, false);

  user.isActive = false;
  user.deletedAt = new Date();
  user.deletedBy = currentUser.id;
  user.updatedBy = currentUser.id;
  user.refreshToken = null;

  await user.save();

  return {
    message:
      "Utilisateur desactive avec succes. Les donnees d'activite sont conservees.",
  };
};

module.exports = {
  createUser,
  deleteUser,
  getCurrentUser,
  getUserById,
  getUsers,
  updateUser,
};
