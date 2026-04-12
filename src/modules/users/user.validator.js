const { body, param, validationResult } = require("express-validator");
const { ROLES } = require("../../common/utils/autorize");

const allowedRoles = Object.values(ROLES);
const allowedCreateFields = ["nom", "prenom", "email", "password", "role"];
const allowedUpdateFields = ["nom", "prenom", "email", "password", "role", "isActive"];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateAllowedFields = (allowedFields, emptyMessage) =>
  body().custom((_, { req }) => {
    const providedFields = Object.keys(req.body || {});

    if (providedFields.length === 0) {
      throw new Error(emptyMessage);
    }

    const invalidField = providedFields.find(
      (field) => !allowedFields.includes(field),
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
  param("id").isMongoId().withMessage("Identifiant utilisateur invalide"),
];

const validateCreateUser = [
  validateAllowedFields(
    allowedCreateFields,
    "nom, prenom et email sont obligatoires",
  ),
  body("nom")
    .trim()
    .notEmpty()
    .withMessage("Le nom est obligatoire"),
  body("prenom")
    .trim()
    .notEmpty()
    .withMessage("Le prenom est obligatoire"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("L'email est obligatoire")
    .bail()
    .isEmail()
    .withMessage("Format d'email invalide")
    .normalizeEmail(),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caracteres"),
  body("role")
    .optional()
    .isIn(allowedRoles)
    .withMessage("Role utilisateur invalide"),
];

const validateUpdateUser = [
  validateAllowedFields(allowedUpdateFields, "Aucune donnee a mettre a jour"),
  body("nom")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Le nom ne peut pas etre vide"),
  body("prenom")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Le prenom ne peut pas etre vide"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Format d'email invalide")
    .normalizeEmail(),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caracteres"),
  body("role")
    .optional()
    .isIn(allowedRoles)
    .withMessage("Role utilisateur invalide"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Le champ isActive doit etre un booleen")
    .toBoolean(),
];

module.exports = {
  validateCreateUser,
  validateObjectId,
  validateRequest,
  validateUpdateUser,
};
