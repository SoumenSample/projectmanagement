// lib/models/KanbanColumn.js
import mongoose from "mongoose";

const kanbanColumnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

const KanbanColumn =
  mongoose.models.KanbanColumn ||
  mongoose.model("KanbanColumn", kanbanColumnSchema);

export default KanbanColumn;