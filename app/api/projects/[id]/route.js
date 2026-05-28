import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import ProjectActivity from "@/lib/models/ProjectActivity";
import User from "@/lib/models/User";
import {
  canAccessProject,
  calculateProjectProgress,
  deriveProjectStatus,
  normalizeListValues,
} from "@/lib/project-utils";
import { emitToUsers } from "@/lib/socket/server";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const subtaskInputSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1).max(120),
});

const taskInputSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1).max(160),
  description: z.string().max(1000).optional().default(""),
  subtasks: z.array(subtaskInputSchema).optional().default([]),
});

const updateProjectSchema = z.object({
  title: z.string().min(2).max(160).optional(),
  description: z.string().max(5000).optional(),
  clientId: z.string().nullable().optional(),
  assignedVendorId: z.string().nullable().optional(),
  assignedEmployeeIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  deadline: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["planning", "in-progress", "at-risk", "completed", "paused"]).optional(),
  tasks: z.array(taskInputSchema).optional(),
  projectCost: z.coerce.number().min(0).optional(),
});

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function normalizeTasks(tasks = [], existingTasks = []) {
  const existingTaskById = new Map(
    (existingTasks || []).map((task) => [task?._id?.toString?.() || task?._id || task?.id || null, task])
  );

  return tasks.map((task) => {
    const taskId = task._id || null;
    const existingTask = taskId ? existingTaskById.get(taskId) : null;
    const existingSubtaskById = new Map(
      (existingTask?.subtasks || []).map((subtask) => [subtask?._id?.toString?.() || subtask?._id || subtask?.id || null, subtask])
    );

    const subtasks = (task.subtasks || []).map((subtask) => {
      const subtaskId = subtask._id || null;
      const existingSubtask = subtaskId ? existingSubtaskById.get(subtaskId) : null;

      return {
        _id: subtaskId || undefined,
        title: subtask.title.trim(),
        isDone: existingSubtask?.isDone ?? false,
        doneBy: existingSubtask?.doneBy ?? null,
        doneAt: existingSubtask?.doneAt ?? null,
      };
    });

    return {
      _id: taskId || undefined,
      title: task.title.trim(),
      description: task.description?.trim?.() || "",
      isDone: existingTask?.isDone ?? false,
      doneBy: existingTask?.doneBy ?? null,
      doneAt: existingTask?.doneAt ?? null,
      subtasks,
    };
  });
}

async function populateProject(projectId) {
  return Project.findById(projectId)
    .populate("client", "name email role source finalBudget")
    .populate("assignedVendor", "name email role")
    .populate("assignedEmployees", "name email role")
    .populate("createdBy", "name email role")
    .populate("updatedBy", "name email role");
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
  const audience = new Set();

  for (const employee of project.assignedEmployees || []) {
    const employeeId = employee?._id?.toString?.() || employee?.toString?.() || employee;
    if (employeeId && employeeId !== actorId) {
      audience.add(employeeId);
    }
  }

  const clientId = project.client?._id?.toString?.() || project.client?.toString?.() || project.client;
  const vendorId = project.assignedVendor?._id?.toString?.() || project.assignedVendor?.toString?.() || project.assignedVendor;
  if (clientId && clientId !== actorId) {
    audience.add(clientId);
  }

  if (vendorId && vendorId !== actorId) {
    audience.add(vendorId);
  }

  const creatorId = project.createdBy?._id?.toString?.() || project.createdBy?.toString?.() || project.createdBy;
  if (creatorId && creatorId !== actorId) {
    audience.add(creatorId);
  }

  if (actorId) {
    audience.add(actorId);
  }

  const recipients = Array.from(audience);

  if (!recipients.length) return;

  emitToUsers(recipients, "project-updated", {
    projectId: project._id?.toString?.() || project._id,
    changeType,
    project,
  });

  await notificationService.createAndEmitNotification({
    userIds: recipients,
    type: "project",
    title: changeType === "assignment-updated" ? "Project assignment updated" : "Project updated",
    message,
    text: message,
    route: "/dashboard/admin/projects",
    source: "project",
    payload: { projectId: project._id?.toString?.() || project._id },
  });
}

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const project = await Project.findById(id)
    .populate("client", "name email role source finalBudget")
    .populate("assignedVendor", "name email role")
    .populate("assignedEmployees", "name email role")
    .populate("createdBy", "name email role")
    .populate("updatedBy", "name email role");

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (!canAccessProject(project, session.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ project });
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  await connectToDatabase();

  const project = await Project.findById(id);

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const previousState = {
    title: project.title,
    status: project.status,
    priority: project.priority,
    deadline: project.deadline,
    assignedEmployeeIds: (project.assignedEmployees || []).map((employee) => employee?._id?.toString?.() || employee?.toString?.() || employee),
    clientId: project.client?._id?.toString?.() || project.client?.toString?.() || project.client,
    assignedVendorId: project.assignedVendor?._id?.toString?.() || project.assignedVendor?.toString?.() || project.assignedVendor,
  };

  if (typeof parsed.data.title === "string") {
    project.title = parsed.data.title.trim();
  }

  if (typeof parsed.data.description === "string") {
    project.description = parsed.data.description.trim();
  }

  if (Object.prototype.hasOwnProperty.call(parsed.data, "clientId")) {
    if (parsed.data.clientId) {
      const client = await User.findById(parsed.data.clientId);

      if (!client || client.role !== "client") {
        return Response.json({ error: "Client not found" }, { status: 400 });
      }

      project.client = client._id;
    } else {
      project.client = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(parsed.data, "assignedVendorId")) {
    if (parsed.data.assignedVendorId) {
      const vendor = await User.findById(parsed.data.assignedVendorId);

      if (!vendor || vendor.role !== "vendor") {
        return Response.json({ error: "Vendor not found" }, { status: 400 });
      }

      project.assignedVendor = vendor._id;
    } else {
      project.assignedVendor = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(parsed.data, "projectCost")) {
    project.projectCost = parsed.data.projectCost ?? 0;
  }

  if (Array.isArray(parsed.data.assignedEmployeeIds)) {
    const normalizedAssigneeIds = normalizeListValues(parsed.data.assignedEmployeeIds);
    const creatorId = String(session.user.id || session.user._id || "");

    const employees = normalizedAssigneeIds.length
      ? await User.find({ _id: { $in: normalizedAssigneeIds }, role: "employee" }).select("_id")
      : [];

    const employeeIds = employees.map((employee) => employee._id.toString());

    // Admin can self-assign even though they are not an employee.
    if (creatorId && normalizedAssigneeIds.includes(creatorId)) {
      project.assignedEmployees = Array.from(new Set([...employeeIds, creatorId]));
    } else {
      project.assignedEmployees = employeeIds;
    }
  }

  if (Array.isArray(parsed.data.tags)) {
    project.tags = normalizeListValues(parsed.data.tags);
  }

  if (parsed.data.deadline) {
    const deadline = parseDate(parsed.data.deadline);

    if (!deadline) {
      return Response.json({ error: "Invalid deadline" }, { status: 400 });
    }

    project.deadline = deadline;
  }

  if (parsed.data.priority) {
    project.priority = parsed.data.priority;
  }

  if (parsed.data.status) {
    project.status = parsed.data.status;
  }

  if (Array.isArray(parsed.data.tasks)) {
    project.tasks = normalizeTasks(parsed.data.tasks, project.tasks || []);
  }

  const { progress } = calculateProjectProgress(project.tasks || []);
  project.progress = progress;
  project.status = deriveProjectStatus(progress, project.status);
  const wasPreviouslyCompleted = previousState.status === "completed";
  const isNowCompleted = project.status === "completed";

  if (!wasPreviouslyCompleted && isNowCompleted) {
    project.completedAt = new Date();
  } else if (wasPreviouslyCompleted && !isNowCompleted) {
    project.completedAt = null;
  }
  project.updatedBy = session.user.id;
  project.lastActivityAt = new Date();

  const nextAssignedEmployeeIds = (project.assignedEmployees || []).map((employee) => employee?._id?.toString?.() || employee?.toString?.() || employee);
  const nextClientId = project.client?._id?.toString?.() || project.client?.toString?.() || project.client;
  const nextVendorId = project.assignedVendor?._id?.toString?.() || project.assignedVendor?.toString?.() || project.assignedVendor;

  const assignmentChanged =
    JSON.stringify(previousState.assignedEmployeeIds.sort()) !== JSON.stringify(nextAssignedEmployeeIds.sort()) ||
    String(previousState.clientId || "") !== String(nextClientId || "") ||
    String(previousState.assignedVendorId || "") !== String(nextVendorId || "");

  await project.save();

  await recordProjectActivity(
    project._id,
    session.user.id,
    "project-updated",
    `Updated project ${project.title}`,
    "Project settings were changed.",
    {
      before: previousState,
      after: {
        title: project.title,
        status: project.status,
        priority: project.priority,
        deadline: project.deadline,
      },
    }
  );

  const populatedProject = await populateProject(project._id);
  await broadcastProjectChange(
    populatedProject,
    session.user.id,
    assignmentChanged ? "assignment-updated" : "updated",
    assignmentChanged ? `Project assignment updated: ${project.title}` : `Project updated: ${project.title}`
  );

  // If project just transitioned to completed, record activity and notify recipients
  if (!wasPreviouslyCompleted && isNowCompleted) {
    await recordProjectActivity(
      project._id,
      session.user.id,
      "project-completed",
      `Project completed: ${project.title}`,
      `Project was marked completed.`,
      { completedAt: project.completedAt }
    );

    const completionMessage = `Project completed: ${project.title} on ${new Date(project.completedAt).toLocaleString()}`;
    await broadcastProjectChange(populatedProject, session.user.id, "completed", completionMessage);

    // Also emit a clear completion notification with an explicit title
    const recipients = (populatedProject.assignedEmployees || []).map((e) => e?._id?.toString?.() || e?.toString?.() || e);
    const clientId = populatedProject.client?._id?.toString?.() || populatedProject.client?.toString?.() || populatedProject.client;
    const vendorId = populatedProject.assignedVendor?._id?.toString?.() || populatedProject.assignedVendor?.toString?.() || populatedProject.assignedVendor;
    if (clientId) recipients.push(clientId);
    if (vendorId) recipients.push(vendorId);
    if (session.user.id) recipients.push(session.user.id);

    await notificationService.createAndEmitNotification({
      userIds: Array.from(new Set(recipients.filter(Boolean))),
      type: "project",
      title: "Project completed",
      message: completionMessage,
      text: completionMessage,
      route: 
        "/dashboard/admin/projects",
      source: "project",
      payload: { projectId: project._id?.toString?.() || project._id, completedAt: project.completedAt },
    });
  }

  return Response.json({ project: populatedProject });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const project = await Project.findById(id);

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const assignedEmployeeIds = (project.assignedEmployees || []).map((employee) => employee?._id?.toString?.() || employee?.toString?.() || employee);
  const clientId = project.client?._id?.toString?.() || project.client?.toString?.() || project.client;
  const vendorId = project.assignedVendor?._id?.toString?.() || project.assignedVendor?.toString?.() || project.assignedVendor;
  const creatorId = project.createdBy?._id?.toString?.() || project.createdBy?.toString?.() || project.createdBy;
  const recipients = Array.from(new Set([creatorId, clientId, vendorId, ...assignedEmployeeIds, session.user.id].filter(Boolean)));

  if (recipients.length) {
    await notificationService.createAndEmitNotification({
      userIds: recipients,
      type: "project",
      title: "Project deleted",
      message: `${project.title} was deleted.`,
      text: `${project.title} was deleted.`,
      source: "project",
      payload: { projectId: project._id?.toString?.() || project._id },
    });
  }

  await ProjectActivity.deleteMany({ project: project._id });
  await Project.findByIdAndDelete(project._id);

  return Response.json({ success: true });
}
