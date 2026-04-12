const Station = require("./station.model");

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

const create = async (data, currentUser = null) => {
  const station = new Station({
    ...data,
    ...getAuditFields(currentUser),
  });
  return await station.save();
};

const getAll = async () => {
  return await Station.find({ isDeleted: { $ne: true } });
};

const getById = async (id) => {
  const station = await Station.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });
  if (!station || station.isDeleted) {
    throw createError("Station non trouvee", 404);
  }
  return station;
};

const updateById = async (id, data, currentUser = null) => {
  const station = await Station.findOneAndUpdate(
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
  if (!station) {
    throw createError("Station non trouvee", 404);
  }
  return station;
};

const deleteById = async (id, currentUser = null) => {
  const station = await Station.findOneAndUpdate(
    {
      _id: id,
      isDeleted: { $ne: true },
    },
    {
      $set: getDeleteAuditFields(currentUser),
    },
    { new: true },
  );
  if (!station) {
    throw createError("Station non trouvee", 404);
  }
  return station;
};

module.exports = { create, getAll, getById, updateById, deleteById };
