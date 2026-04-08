const { body, param, validationResult } = require("express-validator");

const allowedCategories = ["Recyclable", "Non recyclable"];
const allowedUnits = ["kg", "tonne", "litre", "unite"];
const allowedCreateFields = [
  "nom",
  "categorie",
  "description",
  "uniteMesure",
  "dangereux",
];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateAllowedFields = (emptyMessage) =>
  body().custom((_, { req }) => {
    const providedFields = Object.keys(req.body || {});

    if (providedFields.length === 0) {
      throw new Error(emptyMessage);
    }

    const invalidField = providedFields.find(
      (field) => !allowedCreateFields.includes(field),
    );

    if (invalidField) {
      throw new Error("Une ou plusieurs donnees ne sont pas autorisees");
    }

    return true;
  });

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(createError(errors.array()[0].msg, 400));
  }

  return next();
};

const validateObjectId = [
  param("id").isMongoId().withMessage("Identifiant dechet invalide"),
];

const validateCreateDechet = [
  validateAllowedFields("Aucune donnee a enregistrer"),
  body("nom")
    .trim()
    .notEmpty()
    .withMessage("Le nom du dechet est obligatoire"),
  body("categorie")
    .trim()
    .notEmpty()
    .withMessage("La categorie du dechet est obligatoire")
    .bail()
    .isIn(allowedCategories)
    .withMessage("La categorie du dechet est invalide"),
  body("description")
    .optional()
    .trim()
    .isString()
    .withMessage("La description du dechet doit etre une chaine de caractere"),
  body("uniteMesure")
    .optional()
    .trim()
    .isIn(allowedUnits)
    .withMessage("L'unite de mesure du dechet est invalide"),
  body("dangereux")
    .optional()
    .isBoolean()
    .withMessage("Le champ dangereux doit etre un booleen")
    .toBoolean(),
];

const validateUpdateDechet = [
  ...validateObjectId,
  validateAllowedFields("Aucune donnee a mettre a jour"),
  body("nom")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Le nom du dechet ne peut pas etre vide"),
  body("categorie")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La categorie du dechet ne peut pas etre vide")
    .bail()
    .isIn(allowedCategories)
    .withMessage("La categorie du dechet est invalide"),
  body("description")
    .optional()
    .trim()
    .isString()
    .withMessage("La description du dechet doit etre une chaine de caractere"),
  body("uniteMesure")
    .optional()
    .trim()
    .isIn(allowedUnits)
    .withMessage("L'unite de mesure du dechet est invalide"),
  body("dangereux")
    .optional()
    .isBoolean()
    .withMessage("Le champ dangereux doit etre un booleen")
    .toBoolean(),
];

module.exports = {
  validateCreateDechet,
  validateObjectId,
  validateRequest,
  validateUpdateDechet,
};
