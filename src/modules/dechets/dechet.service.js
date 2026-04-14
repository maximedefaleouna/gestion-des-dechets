const Dechet = require("./dechet.model");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getAuditFields = (currentUser) =>
  currentUser
    ? {
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      }
    : {};

const getUpdateAuditFields = (currentUser) =>
  currentUser
    ? {
        updatedBy: currentUser.id,
        updatedAt: new Date(),
      }
    : {};

const getDeleteAuditFields = (currentUser) => ({
  isDeleted: true,
  deletedAt: new Date(),
  deletedBy: currentUser?.id ?? null,
  ...getUpdateAuditFields(currentUser),
});

const createDechet = async (data, currentUser = null) => {
  const dechet = new Dechet({
    ...data,
    ...getAuditFields(currentUser),
  });
  return await dechet.save();
};

const getAllDechets = async () => {
  return await Dechet.find({ isDeleted: { $ne: true } });
};

const getDechetById = async (id) => {
  const dechet = await Dechet.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!dechet || dechet.isDeleted) {
    throw createError("Dechet non trouve", 404);
  }

  return dechet;
};

const updateDechet = async (id, data, currentUser = null) => {
  const dechet = await Dechet.findOneAndUpdate(
    {
      _id: id,
      isDeleted: { $ne: true },
    },
    {
      $set: {
        ...data,
        ...getUpdateAuditFields(currentUser),
      },
    },
    { new: true, runValidators: true },
  );

  if (!dechet) {
    throw createError("Dechet non trouve", 404);
  }

  return dechet;
};

const deleteDechet = async (id, currentUser = null) => {
  const dechet = await Dechet.findOneAndUpdate(
    {
      _id: id,
      isDeleted: { $ne: true },
    },
    {
      $set: getDeleteAuditFields(currentUser),
    },
    { new: true },
  );

  if (!dechet) {
    throw createError("Dechet non trouve", 404);
  }

  return dechet;
};

module.exports = {
  createDechet,
  getAllDechets,
  getDechetById,
  updateDechet,
  deleteDechet,
  // Export for testing
  getAuditFields,
  getUpdateAuditFields,
  getDeleteAuditFields,
};
