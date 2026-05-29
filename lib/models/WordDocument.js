import mongoose from "mongoose"

const wordDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    content: { type: String, default: "" },
    shareToken: { type: String, required: true, unique: true, index: true },
    isShared: { type: Boolean, default: true },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
)

export default mongoose.models.WordDocument || mongoose.model("WordDocument", wordDocumentSchema)
