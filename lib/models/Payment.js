import mongoose from "mongoose"

const PaymentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    clientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    amount: { type: Number, required: true },
    totalFee: { type: Number, required: true },

    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
)

export default mongoose.models.Payment ||
  mongoose.model("Payment", PaymentSchema)