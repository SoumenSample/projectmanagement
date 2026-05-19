import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String,
  file: String,
  createdAt: { type: Date, default: Date.now },
});

const schema = new mongoose.Schema(
  {
    title: String,
    description: String,

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    status: {
      type: String,
      enum: ["open", "in-progress", "closed"],
      default: "open",
    },

    messages: [messageSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Ticket ||
  mongoose.model("Ticket", schema);