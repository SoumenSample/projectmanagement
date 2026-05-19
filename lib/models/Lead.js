import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    services: {
      type: [String],
      default: [],
    },
    requirement: {
      type: String,
      default: "",
      trim: true,
    },
    budget: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      trim: true,
      default: "manual-admin",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    convertedToClient: {
      type: Boolean,
      default: false,
    },
    convertedToClientDate: {
      type: Date,
      default: null,
    },
    convertedToClientBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    convertedClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    nextFollowUpDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

export default Lead;
