import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import ProjectActivity from "@/lib/models/ProjectActivity";
import User from "@/lib/models/User";
import {
  buildProjectVisibilityQuery,
  calculateProjectProgress,
  deriveProjectStatus,
  ensureTaskOrder,
  getProjectAudience,
  normalizeListValues,
} from "@/lib/project-utils";
import { emitToUsers } from "@/lib/socket/server";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const subtaskInputSchema = z.object({
  title: z.string().min(1).max(120),
});

const taskInputSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(1000).optional().default(""),
  subtasks: z.array(subtaskInputSchema).optional().default([]),
});

const createProjectSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(5000).optional().default(""),
  clientId: z.string().optional().nullable(),
  assignedVendorId: z.string().optional().nullable(),
  assignedEmployeeIds: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  startDate: z.string().optional(),
  deadline: z.string(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["planning", "in-progress", "at-risk", "completed", "paused"]).default("planning"),
  tasks: z.array(taskInputSchema).optional().default([]),
  projectCost: z.coerce.number().min(0).optional().default(0),
});

function parseDate(value, fallback = null) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date;
}

async function populateProject(projectId) {
  return Project.findById(projectId)
    .populate("client", "name email role source finalBudget")
    .populate("assignedVendor", "name email role")
    .populate("assignedEmployees", "name email role")
    .populate("createdBy", "name email role")
    .populate("updatedBy", "name email role")
    .populate({ path: "tasks.assignee", select: "name email role" });
}

async function recordProjectActivity(projectId, actorId, type, summary, details = "", metadata = {}) {
  await ProjectActivity.create({
    project: projectId,
    actor: actorId,
    type,
    summary,
    details,
    metadata,
  });
}

async function broadcastProjectChange(project, actorId, changeType, message) {
  const audience = new Set(getProjectAudience(project, actorId));
  if (actorId) {
    audience.add(actorId);
  }

  const recipients = Array.from(audience);

  if (!recipients.length) return;
  const ok1 = emitToUsers(recipients, "project-updated", {
    projectId: project._id?.toString?.() || project._id,
    changeType,
    project,
  });

  const notifications = await notificationService.createAndEmitNotification({
    userIds: recipients,
    type: "project",
    title: changeType === "created" ? "Project created" : "Project updated",
    message,
    text: message,
    route: "/dashboard/admin/projects",
    source: "project",
    payload: { projectId: project._id?.toString?.() || project._id },
  });

  return Boolean(ok1 || notifications.length);
}

function normalizeTasks(tasks = []) {
  return ensureTaskOrder(
    tasks.map((task) => ({
      title: task.title.trim(),
      description: task.description?.trim?.() || "",
      isDone: false,
      subtasks: (task.subtasks || []).map((subtask) => ({
        title: subtask.title.trim(),
        isDone: false,
      })),
    }))
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const query = buildProjectVisibilityQuery(session.user);

  if (!query) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const projects = await Project.find(query)
    .sort({ deadline: 1, updatedAt: -1 })
    .populate("client", "name email role source finalBudget")
    .populate("assignedVendor", "name email role")
    .populate("assignedEmployees", "name email role")
    .populate("createdBy", "name email role")
    .populate("updatedBy", "name email role")
    .lean();

  return Response.json({ projects });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !["admin", "employee"].includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  await connectToDatabase();

  const clientId = parsed.data.clientId?.trim() || null;
  const vendorId = parsed.data.assignedVendorId?.trim() || null;
  let assignedEmployeeIds = normalizeListValues(parsed.data.assignedEmployeeIds);
  const tags = normalizeListValues(parsed.data.tags);
  const deadline = parseDate(parsed.data.deadline);
  const startDate = parseDate(parsed.data.startDate, new Date());

  if (!deadline) {
    return Response.json({ error: "Deadline is required" }, { status: 400 });
  }

  let client = null;
  if (clientId) {
    client = await User.findById(clientId);

    if (!client || client.role !== "client") {
      return Response.json({ error: "Client not found" }, { status: 400 });
    }
  }

  let vendor = null;
  if (vendorId) {
    vendor = await User.findById(vendorId);

    if (!vendor || vendor.role !== "vendor") {
      return Response.json({ error: "Vendor not found" }, { status: 400 });
    }
  }

  // For employees, allow self-assignment and assignment to other employees/admins
  // For admins, allow self-assignment and assignment to any employees/admins
  if (session.user.role === "employee") {
    // Add current user (employee) to assignedEmployeeIds if not already present
    const userIdString = session.user.id;
    if (!assignedEmployeeIds.includes(userIdString)) {
      assignedEmployeeIds.push(userIdString);
    }
  } else if (session.user.role === "admin") {
    // Add current user (admin) to assignedEmployeeIds if not already present
    const userIdString = session.user.id;
    if (!assignedEmployeeIds.includes(userIdString)) {
      assignedEmployeeIds.push(userIdString);
    }
  }

  const assignedUsers = assignedEmployeeIds.length
    ? await User.find({ _id: { $in: assignedEmployeeIds }, role: { $in: ["employee", "admin"] } }).select("_id")
    : [];

  const normalizedEmployeeIds = assignedUsers.map((user) => user._id.toString());
  const tasks = normalizeTasks(parsed.data.tasks || []);
  const { progress } = calculateProjectProgress(tasks);
  const status = deriveProjectStatus(progress, parsed.data.status);

  const project = await Project.create({
    title: parsed.data.title.trim(),
    description: parsed.data.description?.trim?.() || "",
    client: client?._id || null,
    assignedVendor: vendor?._id || null,
    assignedEmployees: normalizedEmployeeIds,
    tags,
    startDate,
    deadline,
    priority: parsed.data.priority,
    status,
    progress,
    tasks,
    projectCost: parsed.data.projectCost ?? 0,
    createdBy: session.user.id,
    updatedBy: session.user.id,
    lastActivityAt: new Date(),
  });

  await recordProjectActivity(
    project._id,
    session.user.id,
    "project-created",
    `Created project ${project.title}`,
    project.description,
    {
      title: project.title,
      priority: project.priority,
      status: project.status,
      assignedEmployees: normalizedEmployeeIds,
      clientId: client?._id || null,
    }
  );

  const populatedProject = await populateProject(project._id);
  const emitOk = await broadcastProjectChange(populatedProject, session.user.id, "created", `New project created: ${project.title}`);

  return Response.json({ project: populatedProject, emitOk }, { status: 201 });
}
