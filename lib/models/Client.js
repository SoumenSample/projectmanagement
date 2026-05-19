import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      default: null,
    },
    region: {
      type: String,
      default: "",
      trim: true,
    },
    services: {
      type: [String],
      default: [],
    },
    budget: {
      type: String,
      default: "",
      trim: true,
    },
    requirement: {
      type: String,
      default: "",
      trim: true,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    convertedFromLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },
    convertedFromLeadDate: {
      type: Date,
      default: null,
    },
    convertedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    source: {
      type: String,
      default: "manual-admin",
      trim: true,
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
    linkedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    finalBudget: {
      type: String,
      required: true,
      default: "0",
      trim: true,
    },
    projectName: {
      type: String,
      default: "",
      trim: true,
    },
    projectDescription: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);

export default Client;
