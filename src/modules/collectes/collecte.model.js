const mongoose = require("mongoose");

const CollecteSchema = new mongoose.Schema(
  {
    station: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: [true, "La station est obligatoire"],
    },
    dechet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dechet",
      required: [true, "Le type de dechet est obligatoire"],
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'agent est obligatoire"],
    },
    quantite: {
      type: Number,
      required: [true, "La quantite collectee est obligatoire"],
      min: [0, "La quantite doit etre positive"],
    },
    dateCollecte: {
      type: Date,
      default: Date.now,
    },
    statut: {
      type: String,
      enum: ["EN_ATTENTE", "VALIDEE", "ANNULEE"],
      default: "VALIDEE",
    },
    commentaire: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

module.exports = mongoose.model("Collecte", CollecteSchema);
