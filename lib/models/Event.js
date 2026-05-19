import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    duration: {
      type: String,
      default: "1 hour",
    },

    type: {
      type: String,
      enum: ["meeting", "event", "personal", "task", "reminder"],
      default: "meeting",
    },

    location: {
      type: String,
      default: "",
    },

    meetingLink: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    attendees: [
      {
        type: String,
      },
    ],

    assignedRoles: [
      {
        type: String,
        enum: ["admin", "employee", "client"],
      },
    ],

    assignedToEmails: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    allDay: {
      type: Boolean,
      default: false,
    },

    reminder: {
      type: Boolean,
      default: true,
    },

    color: {
      type: String,
      default: "bg-blue-500",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Event || mongoose.model("Event", EventSchema);