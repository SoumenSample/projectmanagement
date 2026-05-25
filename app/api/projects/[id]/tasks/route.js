import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import ProjectActivity from "@/lib/models/ProjectActivity";
import {
  canAccessProject,
  calculateProjectProgress,
  deriveProjectStatus,
} from "@/lib/project-utils";
import { emitToUsers } from "@/lib/socket/server";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createTaskSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(1000).optional().default(""),
  subtasks: z.array(z.string().min(1).max(120)).optional().default([]),
});

const toggleTaskSchema = z.object({
  taskId: z.coerce.string().min(1),
  subtaskId: z.union([z.string(), z.number()]).optional().transform((value) => (value == null ? undefined : String(value))),
  isDone: z.coerce.boolean(),
});

async function populateProject(projectId) {
  return Project.findById(projectId)
    .populate("client", "name email role")
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
  if (clientId && clientId !== actorId) {
    audience.add(clientId);
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
    title: changeType === "created" ? "Project created" : "Project updated",
    message,
    text: message,
    source: "project",
    payload: { projectId: project._id?.toString?.() || project._id },
  });
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  await connectToDatabase();

  const project = await Project.findById(id);

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const task = {
    title: parsed.data.title.trim(),
    description: parsed.data.description?.trim?.() || "",
    isDone: false,
    subtasks: parsed.data.subtasks.map((subtaskTitle) => ({
      title: subtaskTitle.trim(),
      isDone: false,
    })),
  };

  project.tasks.push(task);
  const { progress } = calculateProjectProgress(project.tasks);
  project.progress = progress;
  project.status = deriveProjectStatus(progress, project.status);
  project.updatedBy = session.user.id;
  project.lastActivityAt = new Date();

  await project.save();

  await recordProjectActivity(
    project._id,
    session.user.id,
    "task-created",
    `Added task ${task.title}`,
    task.description,
    {
      taskTitle: task.title,
      subtasks: task.subtasks.map((subtask) => subtask.title),
    }
  );

  const populatedProject = await populateProject(project._id);
  await broadcastProjectChange(populatedProject, session.user.id, "task-created", `Task added to ${project.title}`);

  return Response.json({ project: populatedProject }, { status: 201 });
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !["admin", "employee"].includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = toggleTaskSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  await connectToDatabase();

  const project = await Project.findById(id);

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (!canAccessProject(project, session.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const task = project.tasks.id(parsed.data.taskId);

  if (!task) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  const previousTaskState = {
    isDone: task.isDone,
    subtasks: task.subtasks.map((subtask) => ({
      id: subtask._id?.toString?.() || subtask._id,
      isDone: subtask.isDone,
    })),
  };
  const wasPreviouslyCompleted = project.status === "completed";

  let changeType = "task-updated";
  let summary = `Updated task ${task.title}`;

  if (parsed.data.subtaskId) {
    const subtask = task.subtasks.id(parsed.data.subtaskId);

    if (!subtask) {
      return Response.json({ error: "Subtask not found" }, { status: 404 });
    }

    subtask.isDone = parsed.data.isDone;
    subtask.doneBy = parsed.data.isDone ? session.user.id : null;
    subtask.doneAt = parsed.data.isDone ? new Date() : null;

    changeType = parsed.data.isDone ? "subtask-completed" : "subtask-updated";
    summary = parsed.data.isDone
      ? `Completed subtask ${subtask.title}`
      : `Reopened subtask ${subtask.title}`;
  } else {
    task.isDone = parsed.data.isDone;
    task.doneBy = parsed.data.isDone ? session.user.id : null;
    task.doneAt = parsed.data.isDone ? new Date() : null;

    changeType = parsed.data.isDone ? "task-completed" : "task-updated";
    summary = parsed.data.isDone ? `Completed task ${task.title}` : `Reopened task ${task.title}`;
  }

  const { progress } = calculateProjectProgress(project.tasks);
  project.progress = progress;
  project.status = deriveProjectStatus(progress, project.status);
  const isNowCompleted = project.status === "completed";

  if (!wasPreviouslyCompleted && isNowCompleted) {
    project.completedAt = new Date();
  } else if (wasPreviouslyCompleted && !isNowCompleted) {
    project.completedAt = null;
  }
  project.updatedBy = session.user.id;
  project.lastActivityAt = new Date();

  await project.save();

  await recordProjectActivity(
    project._id,
    session.user.id,
    changeType,
    summary,
    "Task progress was updated.",
    {
      taskId: parsed.data.taskId,
      subtaskId: parsed.data.subtaskId || null,
      isDone: parsed.data.isDone,
      previousTaskState,
    }
  );

  const populatedProject = await populateProject(project._id);
  const notificationText =
    changeType === "task-completed"
      ? `Task completed in ${project.title}: ${task.title}`
      : changeType === "subtask-completed"
        ? `Subtask completed in ${project.title}: ${summary}`
        : `${summary} on ${project.title}`;

  await broadcastProjectChange(populatedProject, session.user.id, changeType, notificationText);

  if (!wasPreviouslyCompleted && isNowCompleted) {
    await recordProjectActivity(
      project._id,
      session.user.id,
      "project-completed",
      `Project completed: ${project.title}`,
      `Project was marked completed due to task updates.`,
      { completedAt: project.completedAt }
    );

    const completionMessage = `Project completed: ${project.title} on ${new Date(project.completedAt).toLocaleString()}`;
    // notify recipients specifically about completion
    const recipients = (project.assignedEmployees || []).map((e) => e?._id?.toString?.() || e?.toString?.() || e);
    const clientId = project.client?._id?.toString?.() || project.client?.toString?.() || project.client;
    if (clientId) recipients.push(clientId);
    if (session.user.id) recipients.push(session.user.id);

    await notificationService.createAndEmitNotification({
      userIds: Array.from(new Set(recipients.filter(Boolean))),
      type: "project",
      title: "Project completed",
      message: completionMessage,
      text: completionMessage,
      source: "project",
      payload: { projectId: project._id?.toString?.() || project._id, completedAt: project.completedAt },
    });
  }

  return Response.json({ project: populatedProject });
}
