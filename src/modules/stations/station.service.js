const Station = require("./station.model");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const create = async (data) => {
  const station = new Station(data);
  return await station.save();
};

const getAll = async () => {
  return await Station.find();
};

const getById = async (id) => {
  const station = await Station.findById(id);
  if (!station) {
    throw createError("Station non trouvee", 404);
  }
  return station;
};

const updateById = async (id, data) => {
  const station = await Station.findByIdAndUpdate(id, data, { new: true });
  if (!station) {
    throw createError("Station non trouvee", 404);
  }
  return station;
};

const deleteById = async (id) => {
  const station = await Station.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true } },
    { new: true },
  );
  if (!station) {
    throw createError("Station non trouvee", 404);
  }
  return station;
};

module.exports = { create, getAll, getById, updateById, deleteById };
