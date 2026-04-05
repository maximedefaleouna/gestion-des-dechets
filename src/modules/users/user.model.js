const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "le nom est obligatoire"],
      trim: true,
    },
    prenom: {
      type: String,
      require: [true, "le prenom est obligatoire"],
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Le mot de passe est obligatoire"],
    },

    role: {
      type: String,
      enum: ["AGENT", "ADMIN", "SUPER_ADMIN"],
      default: "AGENT",
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

module.exports = mongoose.model("User", UserSchema);
