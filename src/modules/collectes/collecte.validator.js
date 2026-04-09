const { body, param, query, validationResult } = require("express-validator");

const validateObjectId = [
  param("id")
    .isMongoId()
    .withMessage("Identifiant invalide"),
];

const validateCreateCollecte = [
  body("station")
    .notEmpty()
    .withMessage("La station est obligatoire")
    .isMongoId()
    .withMessage("Identifiant de station invalide"),
  
  body("dechet")
    .notEmpty()
    .withMessage("Le type de déchet est obligatoire")
    .isMongoId()
    .withMessage("Identifiant de déchet invalide"),
  
  body("quantite")
    .notEmpty()
    .withMessage("La quantité est obligatoire")
    .isFloat({ min: 0.01 })
    .withMessage("La quantité doit être un nombre positif"),
  
  body("dateCollecte")
    .optional()
    .isISO8601()
    .withMessage("Format de date invalide"),
  
  body("statut")
    .optional()
    .isIn(["EN_ATTENTE", "VALIDEE", "ANNULEE"])
    .withMessage("Statut invalide"),
  
  body("commentaire")
    .optional()
    .isString()
    .withMessage("Le commentaire doit être du texte")
    .trim(),
];

const validateUpdateCollecte = [
  body("quantite")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("La quantité doit être un nombre positif"),
  
  body("dateCollecte")
    .optional()
    .isISO8601()
    .withMessage("Format de date invalide"),
  
  body("statut")
    .optional()
    .isIn(["EN_ATTENTE", "VALIDEE", "ANNULEE"])
    .withMessage("Statut invalide"),
  
  body("commentaire")
    .optional()
    .isString()
    .withMessage("Le commentaire doit être du texte")
    .trim(),
  
  // Vérifier qu'au moins un champ est fourni
  body().custom((value) => {
    const allowedFields = ["quantite", "dateCollecte", "statut", "commentaire"];
    const providedFields = Object.keys(value).filter(f => allowedFields.includes(f));
    if (providedFields.length === 0) {
      throw new Error("Au moins un champ doit être fourni pour la mise à jour");
    }
    return true;
  }),
];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Erreur de validation",
      errors: errors.array(),
    });
  }
  next();
};

module.exports = {
  validateCreateCollecte,
  validateObjectId,
  validateRequest,
  validateUpdateCollecte,
};