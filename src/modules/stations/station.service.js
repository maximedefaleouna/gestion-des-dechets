const Station = require("./station.model");

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
    throw new Error("Station non trouvee");
  }
  return station;
};

const updateById = async (id, data) => {
  const station = await Station.findByIdAndUpdate(id, data, { new: true });
  if (!station) {
    throw new Error("Station non trouvee");
  }
  return station;
};

const deleteById = async (id) => {
  const station = await Station.updateOne(
    { _id: id },
    { $set: { isDeleted: true } },
  ).exec(id);
  if (!station) {
    throw new Error("Station non trouvee");
  }
  return station;
};

module.exports = { create, getAll, getById, updateById, deleteById };
