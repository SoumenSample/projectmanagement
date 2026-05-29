// app/api/kanban/route.js
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import KanbanTask from "@/lib/models/KanbanTask";
import KanbanColumn from "@/lib/models/KanbanColumn";
import User from "@/lib/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assigneeId: z.string().optional().nullable(),
  assigneeName: z.string().optional().nullable(),
  assigneeInitials: z.string().optional().nullable(),
  collaborators: z
    .array(z.object({ name: z.string(), initials: z.string() }))
    .optional()
    .default([]),
  dueDate: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  columnId: z.string().optional().default("backlog"),
});

const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assigneeId: z.string().optional().nullable(),
  assigneeName: z.string().optional().nullable(),
  assigneeInitials: z.string().optional().nullable(),
  // FIX: updateAssignee must be explicitly true for assignee fields to be mutated.
  // This prevents editing title/description from accidentally wiping the assignee.
  updateAssignee: z.boolean().optional().default(false),
  collaborators: z
    .array(z.object({ name: z.string(), initials: z.string() }))
    .optional(),
  dueDate: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  // FIX: columnId is authoritative — never derive column from isDone
  columnId: z.string().optional(),
});

const createColumnSchema = z.object({
  action: z.literal("createColumn"),
  columnId: z.string().min(1),
  title: z.string().min(1).max(100),
});

const deleteColumnSchema = z.object({
  action: z.literal("deleteColumn"),
  columnId: z.string().min(1),
});

// ─── Default columns ──────────────────────────────────────────────────────────

const DEFAULT_COLUMNS = [
  { id: "backlog", title: "Backlog", order: 0 },
  { id: "in-progress", title: "In Progress", order: 1 },
  { id: "done", title: "Done", order: 2 },
];

async function ensureDefaultColumns() {
  const count = await KanbanColumn.countDocuments();
  if (count === 0) {
    await KanbanColumn.insertMany(DEFAULT_COLUMNS);
  }
}

// ─── Helper: build initials from a full name ──────────────────────────────────

function makeInitials(name = "") {
  return (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── GET — return all columns + tasks ─────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  await ensureDefaultColumns();

  // Fetch columns sorted by their persisted order
  const dbColumns = await KanbanColumn.find({}).sort({ order: 1 }).lean();

  // FIX: populate both assignee AND createdBy so we have full user info
  const tasks = await KanbanTask.find({})
    .populate("assignee", "name email")
    .populate("createdBy", "name email")
    .lean();

  // Build columnId → tasks[] map
  const taskMap = {};
  for (const col of dbColumns) {
    taskMap[col.id] = [];
  }

  for (const t of tasks) {
    // FIX: columnId is the ONLY source of truth — never override from isDone
    const colId = t.columnId || "backlog";
    const targetColId = taskMap[colId] !== undefined ? colId : "backlog";

    // FIX: expose createdByName so the frontend can show who created the task
    const createdByName =
      t.createdBy
        ? t.createdBy.name || t.createdBy.email || ""
        : "";
    const createdById = t.createdBy?._id?.toString() ?? "";

    const task = {
      id: t._id?.toString(),
      title: t.title,
      description: t.description || "",
      priority: t.priority || "medium",
      assignee:
        t.assigneeName ||
        (t.assignee && (t.assignee.name || t.assignee.email)) ||
        "",
      assigneeId: t.assignee?._id?.toString() ?? "",
      assigneeInitials: t.assigneeInitials || "",
      collaborators: t.collaborators || [],
      dueDate: t.dueDate
        ? new Date(t.dueDate).toISOString().slice(0, 10)
        : "",
      tags: t.tags || [],
      comments: t.comments || 0,
      attachments: t.attachments || 0,
      createdByName,
      createdById,
    };

    if (taskMap[targetColId]) {
      taskMap[targetColId].push(task);
    } else {
      if (!taskMap["backlog"]) taskMap["backlog"] = [];
      taskMap["backlog"].push(task);
    }
  }

  const columns = dbColumns.map((col) => ({
    id: col.id,
    title: col.title,
    tasks: taskMap[col.id] || [],
  }));

  return Response.json({ columns });
}

// ─── POST — create task OR create column ──────────────────────────────────────

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    !["admin", "employee"].includes(session.user.role)
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  await connectToDatabase();

  // ── Create column ─────────────────────────────────────────────────────────
  if (body.action === "createColumn") {
    const parsed = createColumnSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { columnId, title } = parsed.data;
    const maxOrderDoc = await KanbanColumn.findOne({}).sort({ order: -1 }).lean();
    const nextOrder = maxOrderDoc ? (maxOrderDoc.order ?? 0) + 1 : 0;

    await KanbanColumn.updateOne(
      { id: columnId },
      { $setOnInsert: { id: columnId, title, order: nextOrder } },
      { upsert: true }
    );

    return Response.json({ ok: true }, { status: 201 });
  }

  // ── Create task ───────────────────────────────────────────────────────────
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  // FIX: If no assignee is provided, auto-assign to the session user (creator)
  let assigneeUser = null;
  if (parsed.data.assigneeId) {
    assigneeUser = await User.findById(parsed.data.assigneeId).select("_id name email");
  } else {
    // Auto-assign to creator
    assigneeUser = await User.findById(session.user.id).select("_id name email");
  }

  const resolvedAssigneeName =
    parsed.data.assigneeName ||
    (assigneeUser ? assigneeUser.name || assigneeUser.email : "");
  const resolvedAssigneeInitials =
    parsed.data.assigneeInitials ||
    makeInitials(resolvedAssigneeName);

  // Auto-include assignee in collaborators if not already present
  const collaborators = [...(parsed.data.collaborators || [])];
  if (
    resolvedAssigneeName &&
    !collaborators.some((c) => c.name === resolvedAssigneeName)
  ) {
    collaborators.unshift({
      name: resolvedAssigneeName,
      initials: resolvedAssigneeInitials,
    });
  }

  const doc = await KanbanTask.create({
    title: parsed.data.title.trim(),
    description: parsed.data.description?.trim() || "",
    priority: parsed.data.priority || "medium",
    assignee: assigneeUser ? assigneeUser._id : null,
    assigneeName: resolvedAssigneeName,
    assigneeInitials: resolvedAssigneeInitials,
    collaborators,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    tags: parsed.data.tags || [],
    // FIX: always persist columnId — this is the only field that determines column placement
    columnId: parsed.data.columnId || "backlog",
    createdBy: session.user.id,
    updatedBy: session.user.id,
  });

  return Response.json({ taskId: doc._id?.toString() }, { status: 201 });
}

// ─── PATCH — update task OR reorder columns ───────────────────────────────────

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    !["admin", "employee"].includes(session.user.role)
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  await connectToDatabase();

  // ── Reorder columns ───────────────────────────────────────────────────────
  if (body.action === "reorderColumns") {
    const orderedIds = body.orderedIds;
    if (!Array.isArray(orderedIds)) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const ops = orderedIds.map((id, idx) => ({
      updateOne: { filter: { id }, update: { $set: { order: idx } } },
    }));
    await KanbanColumn.bulkWrite(ops);
    return Response.json({ ok: true });
  }

  // ── Update task ───────────────────────────────────────────────────────────
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id, ...data } = parsed.data;
  const task = await KanbanTask.findById(id);
  if (!task) return Response.json({ error: "Not found" }, { status: 404 });

  if (data.title !== undefined) task.title = data.title.trim();
  if (data.description !== undefined) task.description = data.description?.trim() || "";
  if (data.priority !== undefined) task.priority = data.priority;

  // FIX: Only update assignee fields when caller explicitly sends updateAssignee:true
  if (data.updateAssignee === true) {
    // Look up assignee by id if provided, otherwise try by name from DB
    let resolvedUser = null;
    if (data.assigneeId) {
      resolvedUser = await User.findById(data.assigneeId).select("_id name email");
    }
    task.assignee = resolvedUser ? resolvedUser._id : null;
    task.assigneeName = data.assigneeName || (resolvedUser ? resolvedUser.name || resolvedUser.email : "") || "";
    task.assigneeInitials = data.assigneeInitials || makeInitials(task.assigneeName);
  }

  if (data.collaborators !== undefined) task.collaborators = data.collaborators;
  if (data.dueDate !== undefined) {
    task.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }
  if (data.tags !== undefined) task.tags = data.tags;

  // FIX: columnId is authoritative. pre-save hook keeps isDone in sync.
  if (data.columnId !== undefined) {
    task.columnId = data.columnId;
    // isDone is updated by pre-save hook — no need to set it here
  }

  task.updatedBy = session.user.id;
  await task.save(); // pre-save hook syncs isDone

  return Response.json({ ok: true });
}

// ─── DELETE — delete task OR column ──────────────────────────────────────────

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    !["admin", "employee"].includes(session.user.role)
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  await connectToDatabase();

  // ── Delete column — orphaned tasks move to backlog ────────────────────────
  if (body.action === "deleteColumn") {
    const parsed = deleteColumnSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { columnId } = parsed.data;
    await KanbanTask.updateMany({ columnId }, { $set: { columnId: "backlog", isDone: false } });
    await KanbanColumn.deleteOne({ id: columnId });

    return Response.json({ ok: true });
  }

  // ── Delete task ───────────────────────────────────────────────────────────
  const taskId = body.id;
  if (!taskId) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const result = await KanbanTask.deleteOne({ _id: taskId });
  return Response.json({ deletedCount: result.deletedCount || 0 });
}