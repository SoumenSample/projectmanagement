const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Notification",
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      default: "info",
      trim: true,
    },
    route: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      default: "",
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
