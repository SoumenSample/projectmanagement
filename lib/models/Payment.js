import mongoose from "mongoose"

const PaymentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    // Optional employee recipient (when payment is for an employee)
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Optional vendor recipient (when payment is for a vendor)
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    clientEmail: {
      type: String,
      lowercase: true,
      trim: true,
      // required only for client-backed payments
      required: function () {
        return !this.employee && !this.vendor
      },
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