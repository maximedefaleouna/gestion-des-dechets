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
      enum: ["Recyclable", "Non recyclable"],
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
      default: null,
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

    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
  },
);

module.exports = mongoose.model("Dechet", DechetSchema);
