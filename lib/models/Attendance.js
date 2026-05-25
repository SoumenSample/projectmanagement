import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: null,
    },
    capturedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    attendanceDate: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["checked-in", "checked-out"],
      default: "checked-in",
    },
    checkInAt: {
      type: Date,
      default: null,
    },
    checkOutAt: {
      type: Date,
      default: null,
    },
    checkInLocation: {
      type: locationSchema,
      default: null,
    },
    checkOutLocation: {
      type: locationSchema,
      default: null,
    },
    officeLocation: {
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
    },
    officeDistanceMeters: {
      type: Number,
      default: null,
    },
    checkInLocationType: {
      type: String,
      enum: ["office", "home", "outside", null],
      default: null,
    },
    checkOutLocationType: {
      type: String,
      enum: ["office", "home", "outside", null],
      default: null,
    },
    checkInHomeDistanceMeters: {
      type: Number,
      default: null,
    },
    checkOutHomeDistanceMeters: {
      type: Number,
      default: null,
    },
    checkInWithinOfficeRadius: {
      type: Boolean,
      default: null,
    },
    checkOutWithinOfficeRadius: {
      type: Boolean,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ user: 1, attendanceDate: 1 }, { unique: true });
attendanceSchema.index({ attendanceDate: -1, updatedAt: -1 });

const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);

export default Attendance;