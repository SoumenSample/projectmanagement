import mongoose from "mongoose";

const billingLineSchema = new mongoose.Schema(
  {
    item: { type: String, required: true, trim: true },
    period: { type: String, default: "", trim: true },
    unitPriceLabel: { type: String, default: "", trim: true },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const billingAdjustmentSchema = new mongoose.Schema(
  {
    label: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const paymentDetailsSchema = new mongoose.Schema(
  {
    upiId: { type: String, default: "", trim: true },
    bankName: { type: String, default: "", trim: true },
    accountName: { type: String, default: "", trim: true },
    upiNumber: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const billingSchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      enum: ["template", "uploaded"],
      default: "template",
    },
    type: {
      type: String,
      enum: ["bill", "invoice"],
      required: true,
    },
    referenceNumber: { type: String, required: true, trim: true },
    documentTitle: { type: String, required: true, trim: true },
    documentSubtitle: { type: String, default: "", trim: true },

    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientName: { type: String, required: true, trim: true },
    recipientCompany: { type: String, default: "", trim: true },
    recipientAddress: { type: String, default: "", trim: true },
    recipientEmail: { type: String, default: "", trim: true },

    issuerName: { type: String, required: true, trim: true },
    issuerEmail: { type: String, default: "", trim: true },
    issuerAddress: { type: String, default: "", trim: true },

    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    isPaid: { type: Boolean, default: false },
    strikeDueDate: { type: Boolean, default: false },

    lineItems: {
      type: [billingLineSchema],
      default: [],
    },
    adjustmentRows: {
      type: [billingAdjustmentSchema],
      default: [],
    },
    advanceRow: {
      type: billingAdjustmentSchema,
      default: () => ({ label: "ADVANCE", description: "", amount: 0 }),
    },

    subtotal: { type: Number, default: 0 },
    adjustmentTotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    notes: { type: [String], default: [] },
    paymentHeading: { type: String, default: "", trim: true },
    paymentDetails: {
      type: paymentDetailsSchema,
      default: () => ({}),
    },
    footerMessage: { type: String, default: "", trim: true },
    supportPhone: { type: String, default: "", trim: true },
    supportEmail: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    supportAddress: { type: String, default: "", trim: true },
    fileUrl: { type: String, default: "", trim: true },
    fileName: { type: String, default: "", trim: true },
    fileMimeType: { type: String, default: "", trim: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Billing || mongoose.model("Billing", billingSchema);