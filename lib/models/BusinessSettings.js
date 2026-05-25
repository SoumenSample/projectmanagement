import mongoose from "mongoose";

const businessSettingsSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      default: "global",
      unique: true,
      index: true,
      trim: true,
    },
    businessName: {
      type: String,
      default: "Project Management",
      trim: true,
    },
    logoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    gstin: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    tagline: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const BusinessSettings =
  mongoose.models.BusinessSettings || mongoose.model("BusinessSettings", businessSettingsSchema);

export default BusinessSettings;