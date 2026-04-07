const mongoose = require("mongoose");
const logger = require("../utils/logger");
const DB = process.env.MONGO_URI;

// connection a la base de donnee mongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(DB);
    logger.info("Database connected");
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
