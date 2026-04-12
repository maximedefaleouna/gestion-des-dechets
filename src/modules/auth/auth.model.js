const mongoose = require("mongoose");

const PasswordResetCodeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'utilisateur est obligatoire"],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      trim: true,
      lowercase: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: [true, "Le code de verification est obligatoire"],
      select: false,
    },
    codeExpiresAt: {
      type: Date,
      required: [true, "La date d'expiration du code est obligatoire"],
      index: true,
    },
    codeAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    resetTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    resetTokenExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

PasswordResetCodeSchema.pre("save", function updateTimestamp() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model(
  "PasswordResetCode",
  PasswordResetCodeSchema,
);
