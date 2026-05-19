import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    doneBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    doneAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    doneBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    doneAt: {
      type: Date,
      default: null,
    },
    subtasks: {
      type: [subtaskSchema],
      default: [],
    },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedEmployees: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["planning", "in-progress", "at-risk", "completed", "paused"],
      default: "planning",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tasks: {
      type: [taskSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ client: 1, deadline: 1 });
projectSchema.index({ assignedEmployees: 1, status: 1 });

const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;
