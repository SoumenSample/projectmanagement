import mongoose from "mongoose"

const QuotationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { 
    timestamps: true,
    strictPopulate: false,
  }
)

export default mongoose.models.Quotation ||
  mongoose.model("Quotation", QuotationSchema)