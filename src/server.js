const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const logger = require("./common/utils/logger");
const connectDB = require("./common/config/db");
const { bootstrapInitialData } = require("./common/bootstrap/seed");

const startApp = async () => {
  const PORT = process.env.PORT || 3000;
  if (!process.env.PORT) logger.error("PORT is not defined");
  await connectDB();
  await bootstrapInitialData();
  app.listen(PORT, () => {
    console.log(
      `Server is running on http://localhost:${PORT} and docs on http://localhost:${PORT}/api-docs`,
    );

    logger.info(`Server is running on http://localhost:${PORT}`);
  });
};

startApp();
