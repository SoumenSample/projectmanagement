import mongoose from "mongoose";

const marketplaceProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "web-development",
        "app-development",
        "ui-ux-design",
        "graphic-design",
        "digital-marketing",
        "software-development",
        "ai-intelligent-systems",
        "research-and-analytics",
      ],
    },
    imageUrl: {
      type: String,
      required: true,
    },
    demoLink: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    createdByEmail: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    interests: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

marketplaceProductSchema.index({ category: 1 });
marketplaceProductSchema.index({ createdBy: 1 });
marketplaceProductSchema.index({ isActive: 1 });

export default mongoose.models.MarketplaceProduct ||
  mongoose.model("MarketplaceProduct", marketplaceProductSchema);
