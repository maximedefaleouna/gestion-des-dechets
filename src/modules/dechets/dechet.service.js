const Dechet = require("./dechet.model");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createDechet = async (data) => {
  const dechet = new Dechet(data);
  return await dechet.save();
};

const getAllDechets = async () => {
  return await Dechet.find();
};

const getDechetById = async (id) => {
  const dechet = await Dechet.findById(id);
  if (!dechet || dechet.isDeleted) {
    throw createError("Dechet non trouvé", 404);
  }
  return dechet;
};

const updateDechet = async (id, data) => {
  const dechet = await Dechet.findByIdAndUpdate(id, data, { new: true });
  if (!dechet) {
    throw createError("Dechet non trouvé", 404);
  }
  return dechet;
};

const deleteDechet = async (id) => {
  const dechet = await Dechet.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!dechet) {
    throw createError("Dechet non trouvé", 404);
  }
  return dechet;
};
module.exports = {
  createDechet,
  getAllDechets,
  getDechetById,
  updateDechet,
  deleteDechet,
};
