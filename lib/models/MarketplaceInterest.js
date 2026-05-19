import mongoose from "mongoose";

const marketplaceInterestSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketplaceProduct",
      required: true,
    },
    productTitle: {
      type: String,
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    clientPhone: {
      type: String,
      required: true,
      trim: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorEmail: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "contacted", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

marketplaceInterestSchema.index({ productId: 1 });
marketplaceInterestSchema.index({ clientId: 1 });
marketplaceInterestSchema.index({ creatorId: 1 });

export default mongoose.models.MarketplaceInterest ||
  mongoose.model("MarketplaceInterest", marketplaceInterestSchema);
