import mongoose from "mongoose"

const ContractSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },

    createdDate: { type: Date, default: Date.now },

    // 📧 RECIPIENT FIELDS
    recipientType: {
      type: String,
      enum: ["client", "employee"],
      default: "client",
      required: true,
    },

    clientEmail: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          // clientEmail is required only if recipientType is "client"
          if (this.recipientType === "client") {
            return v && v.length > 0
          }
          return true
        },
        message: "Client email is required when issuing to a client",
      },
    },

    employeeEmail: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          // employeeEmail is required only if recipientType is "employee"
          if (this.recipientType === "employee") {
            return v && v.length > 0
          }
          return true
        },
        message: "Employee email is required when issuing to an employee",
      },
    },

    reference: { type: String, required: true },

    // 👨‍💼 ADMIN SIGNATURE
    adminSignature: { type: String },
    adminSignedDate: { type: Date },

    // 👤 CLIENT/EMPLOYEE SIGNATURE
    signature: { type: String },
    signedDate: { type: Date },

    // 📅 Contract validity period
    validFrom: { type: Date },
    validTo: { type: Date },

    // 📊 STATUS
    status: {
      type: String,
      enum: ["pending", "admin-signed", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
)

export default mongoose.models.Contract ||
  mongoose.model("Contract", ContractSchema)