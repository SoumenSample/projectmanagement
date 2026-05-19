import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "client", "employee"],
      default: "client",
      required: true,
    },
    phone: {
  type: String,
  required: false, // ✅ change this
},
    age: {
      type: Number,
      default: null,
      min: 0,
    },
    region: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ✅ ADD THESE TWO FIELDS
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
    clientProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    source: {
      type: String,
      default: "manual-admin",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;