import mongoose from "mongoose"

const spreadsheetDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    cells: { type: [[String]], default: [] },
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

export default mongoose.models.SpreadsheetDocument || mongoose.model("SpreadsheetDocument", spreadsheetDocumentSchema)
