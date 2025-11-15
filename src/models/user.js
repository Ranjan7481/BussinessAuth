const mongoose = require("mongoose");
const validator = require("validator");
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,

      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("invalid email and" + value);
        }
      },
    },
    password: { type: String, default: null }, // bcrypt hash
    role: { type: String, enum: ["admin", "business"], default: "business" },
    isVerified: { type: Boolean, default: false },

    // OTP (store hashed sha256)
    otpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpResendCount: { type: Number, default: 0 },
    otpResendWindowStart: { type: Date, default: null },

    // Reset token (store hashed sha256)
    resetTokenHash: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },

    // OAuth
    googleId: { type: String, default: null },
  },
  { timestamps: true }
);

// instance method for comparing password implemented in utils/passwordUtils
module.exports = mongoose.model("User", userSchema);
