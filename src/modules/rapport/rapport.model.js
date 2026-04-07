const mongoose = require("mongoose");

const RapportSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Le titre du rapport est obligatoire"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    station: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
    },
    generePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'utilisateur qui genere le rapport est obligatoire"],
    },
    periode: {
      dateDebut: {
        type: Date,
        required: [true, "La date de debut est obligatoire"],
      },
      dateFin: {
        type: Date,
        required: [true, "La date de fin est obligatoire"],
      },
    },
    totalCollectes: {
      type: Number,
      default: 0,
      min: [0, "Le total des collectes doit etre positif"],
    },
    quantiteTotale: {
      type: Number,
      default: 0,
      min: [0, "La quantite totale doit etre positive"],
    },
    statut: {
      type: String,
      enum: ["BROUILLON", "GENERE", "ARCHIVE"],
      default: "GENERE",
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

module.exports = mongoose.model("Rapport", RapportSchema);
