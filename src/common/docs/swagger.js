const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "RecycleTrack API",
      version: "1.0.0",
      description:
        "Documentation officielle de l'API RecycleTrack. Elle decrit les contrats exacts des endpoints, les champs obligatoires et facultatifs, les exemples de payloads, les schemas de reponse et les regles de securite.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Serveur local de developpement",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT d'access token a transmettre dans le header Authorization sous la forme Bearer <token>.",
        },
      },
    },
  },
  apis: [
    path
      .resolve(__dirname, "../../modules/**/*.swagger.js")
      .replace(/\\/g, "/"),
  ],
};

module.exports = swaggerJsdoc(swaggerOptions);
