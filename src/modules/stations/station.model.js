const mongoose = require("mongoose");

const StationSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la station est obligatoire"],
      trim: true,
    },
    adresse: {
      type: String,
      required: [true, "L'adresse de la station est obligatoire"],
      trim: true,
    },
    ville: {
      type: String,
      required: [true, "La ville est obligatoire"],
      trim: true,
    },
    capaciteMax: {
      type: Number,
      required: [true, "La capacite maximale est obligatoire"],
      min: [0, "La capacite maximale doit etre positive"],
    },
    capaciteActuelle: {
      type: Number,
      default: 0,
      min: [0, "La capacite actuelle doit etre positive"],
    },
    typesDechetsAcceptes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Dechet",
      },
    ],
    localisation: {
      latitude: {
        type: Number,
        required: [true, "La latitude est obligatoire"],
      },
      longitude: {
        type: Number,
        required: [true, "La longitude est obligatoire"],
      },
    },
    statut: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
      default: "ACTIVE",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    versionKey: false,
  },
);

module.exports = mongoose.model("Station", StationSchema);
