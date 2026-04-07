const bcrypt = require("bcryptjs");
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
      required: [true, "le prenom est obligatoire"],
      trim: true,
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
      select: false,
    },

    role: {
      type: String,
      enum: ["AGENT", "ADMIN", "SUPER_ADMIN"],
      default: "AGENT",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

UserSchema.pre("save", async function savePassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.pre("save", function updateTimestamp() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model("User", UserSchema);
