const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const logger = require("./common/utils/logger");
const swaggerSpec = require("./common/docs/swagger");
const authRoutes = require("./modules/auth/auth.routes");
const dechetRoutes = require("./modules/dechets/dechet.routes");
const userRoutes = require("./modules/users/user.routes");
const collecteRoutes = require("./modules/collectes/collecte.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Projet Goupe 2");
});

app.get("/api-docs.json", (req, res) => {
  res.status(200).json(swaggerSpec);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "RecycleTrack API Docs",
  }),
);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dechets", dechetRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/collectes", collecteRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route introuvable",
  });
});

app.use((error, req, res, next) => {
  const statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : 500;

  logger.error({
    message: error.message,
    stack: error.stack,
    statusCode,
    method: req.method,
    url: req.originalUrl,
  });

  res.status(statusCode).json({
    message:
      statusCode >= 500
        ? "Une erreur est survenue"
        : error.message || "Une erreur est survenue",
  });
});

module.exports = app;
