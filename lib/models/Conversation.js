import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Conversation ||
  mongoose.model("Conversation", schema);