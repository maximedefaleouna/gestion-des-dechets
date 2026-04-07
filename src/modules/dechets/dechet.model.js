const mongoose = require("mongoose");

const DechetSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom du dechet est obligatoire"],
      unique: true,
      trim: true,
    },
    categorie: {
      type: String,
      required: [true, "La categorie du dechet est obligatoire"],
      enum: ["PLASTIQUE", "VERRE", "PAPIER", "METAL", "ELECTRONIQUE", "ORGANIQUE", "AUTRE"],
    },
    description: {
      type: String,
      trim: true,
    },
    uniteMesure: {
      type: String,
      enum: ["kg", "tonne", "litre", "unite"],
      default: "kg",
    },
    dangereux: {
      type: Boolean,
      default: false,
    },
    recyclable: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model("Dechet", DechetSchema);
