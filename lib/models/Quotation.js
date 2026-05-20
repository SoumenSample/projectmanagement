import mongoose from "mongoose"

const QuotationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String },
    date: { type: String },
    organizationName: { type: String },
    organizationDetails: { type: String },
    projectDuration: { type: String },
    requiredDetails: { type: String },
    projectAssetsTechStack: { type: String },
    termsAndConditions: { type: String },
    contractDetails: { type: String },
    thankYouNote: { type: String },
    subtotal: { type: String },
    discount: { type: String },
    total: { type: String },
    businessName: { type: String },
    businessLogoUrl: { type: String },
    businessEmail: { type: String },
    businessPhone: { type: String },
    businessWebsite: { type: String },
    businessAddress: { type: String },
    whyChooseUs: { type: [String], default: [] },
    costBreakdown: {
      type: [
        {
          item: { type: String },
          description: { type: String },
          amount: { type: String },
        },
      ],
      default: [],
    },
    addOns: {
      type: [
        {
          label: { type: String },
          amount: { type: String },
        },
      ],
      default: [],
    },
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