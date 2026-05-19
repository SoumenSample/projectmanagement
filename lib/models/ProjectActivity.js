import mongoose from "mongoose";

const projectActivitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: [
        "project-created",
        "project-updated",
        "task-created",
        "task-updated",
        "task-completed",
        "subtask-updated",
        "subtask-completed",
      ],
      required: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      default: "",
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

projectActivitySchema.index({ project: 1, createdAt: -1 });

const ProjectActivity =
  mongoose.models.ProjectActivity ||
  mongoose.model("ProjectActivity", projectActivitySchema);

export default ProjectActivity;
