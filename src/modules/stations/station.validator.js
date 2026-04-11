const { body, param, validationResult } = require("express-validator");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateAllowedFields = (allowedFields, emptyMessage) =>
  body().custom((_, { req }) => {
    const providedFields = Object.keys(req.body || {});

    if (providedFields.length === 0) {
      throw createError(emptyMessage, 400);
    }

    const invalidField = providedFields.find(
      (field) => !allowedFields.includes(field),
    );

    if (invalidField) {
      throw createError("Une ou plusieurs donnees ne sont pas autorisees", 400);
    }

    return true;
  });

const validateObjectId = [
  param("id").isMongoId().withMessage("Identifiant station invalide"),
];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(createError(errors.array()[0].msg, 400));
  }

  return next();
};

const validateCreateStation = [
  validateAllowedFields(
    [
      "nom",
      "adresse",
      "ville",
      "capaciteMax",
      "typesDechetsAcceptes",
      "localisation",
    ],
    "nom, adresse, ville, capaciteMax, typesDechetsAcceptes et localisation sont obligatoires",
  ),
  body("nom")
    .trim()
    .notEmpty()
    .withMessage("Le nom de la station est obligatoire"),
  body("adresse")
    .trim()
    .notEmpty()
    .withMessage("L'adresse de la station est obligatoire"),
  body("ville")
    .trim()
    .notEmpty()
    .withMessage("La ville de la station est obligatoire"),
  body("capaciteMax")
    .isInt()
    .withMessage("La capacite maximale doit etre un entier"),
  body("typesDechetsAcceptes")
    .isArray({ min: 1 })
    .withMessage("Au moins un type de dechet accepte est requis"),
  body("typesDechetsAcceptes.*")
    .isMongoId()
    .withMessage("Identifiant de dechet invalide"),
  body("localisation")
    .isObject()
    .withMessage("La localisation doit etre un objet"),
  body("localisation.latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("La latitude doit etre comprise entre -90 et 90"),
  body("localisation.longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("La longitude doit etre comprise entre -180 et 180"),
];

const validateUpdateStation = [
  ...validateObjectId,
  validateAllowedFields(
    [
      "nom",
      "adresse",
      "ville",
      "capaciteMax",
      "capaciteActuelle",
      "typesDechetsAcceptes",
      "localisation",
      "statut",
    ],
    "Aucune donnee a mettre a jour",
  ),
  body("nom")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Le nom de la station ne peut pas etre vide"),
  body("adresse")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("L'adresse de la station ne peut pas etre vide"),
  body("ville")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La ville de la station ne peut pas etre vide"),
  body("capaciteMax")
    .optional()
    .isInt()
    .withMessage("La capacite maximale doit etre un entier"),
  body("capaciteActuelle")
    .optional()
    .isInt()
    .withMessage("La capacite actuelle doit etre un entier"),
  body("typesDechetsAcceptes")
    .optional()
    .isArray()
    .withMessage("Les types de dechets acceptes doivent etre un tableau"),
  body("typesDechetsAcceptes.*")
    .optional()
    .isMongoId()
    .withMessage("Identifiant de dechet invalide"),
  body("localisation")
    .optional()
    .isObject()
    .withMessage("La localisation doit etre un objet"),
  body("localisation.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("La latitude doit etre comprise entre -90 et 90"),
  body("localisation.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("La longitude doit etre comprise entre -180 et 180"),
  body("statut")
    .optional()
    .isIn(["ACTIVE", "INACTIVE", "MAINTENANCE"])
    .withMessage("Le statut de la station est invalide"),
];

const validateGetStation = [...validateObjectId];
const validateDeleteStation = [...validateObjectId];

module.exports = {
  validateCreateStation,
  validateDeleteStation,
  validateGetStation,
  validateObjectId,
  validateRequest,
  validateUpdateStation,
};
