// lib/models/KanbanTask.js
import mongoose from "mongoose";

const collaboratorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    initials: { type: String, required: true },
  },
  { _id: false }
);

const kanbanTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // Assignee — populated ref + cached display fields for fast reads
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assigneeName: { type: String, default: "" },
    assigneeInitials: { type: String, default: "" },

    collaborators: { type: [collaboratorSchema], default: [] },

    dueDate: { type: Date, default: null },
    tags: { type: [String], default: [] },

    comments: { type: Number, default: 0 },
    attachments: { type: Number, default: 0 },

    // ── Column placement ──────────────────────────────────────────────────────
    // FIX: columnId is the single source of truth for which column a task is in.
    // isDone is kept for legacy query compatibility but always derived from columnId.
    columnId: { type: String, required: true, default: "backlog", index: true },
    isDone: { type: Boolean, default: false }, // legacy — kept in sync by API

    // ── Audit ─────────────────────────────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Keep isDone in sync whenever columnId changes via a pre-save hook
kanbanTaskSchema.pre("save", function (next) {
  this.isDone = this.columnId === "done";
  next();
});

const KanbanTask =
  mongoose.models.KanbanTask || mongoose.model("KanbanTask", kanbanTaskSchema);

export default KanbanTask;