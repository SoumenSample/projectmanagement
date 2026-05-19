import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Ticket from "@/lib/models/Ticket";
import User from "@/lib/models/User";
import Project from "@/lib/models/Project";
import { buildProjectVisibilityQuery } from "@/lib/project-utils";
import { emitToUsers } from "@/lib/socket/server";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadTickets(query) {
  return Ticket.find(query)
    .sort({ updatedAt: -1, createdAt: -1 })
    .populate("createdBy", "name email role")
    .populate("assignedTo", "name email role")
    .populate("project", "title client assignedEmployees")
    .populate("messages.sender", "name email role");
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  let tickets;

  if (session.user.role === "admin") {
    tickets = await loadTickets({});
  } else if (session.user.role === "employee") {
    tickets = await loadTickets({
      $or: [
        { assignedTo: session.user.id },
        { createdBy: session.user.id },
        { assignedTo: null, status: "open" },
      ],
    });
  } else {
    tickets = await loadTickets({
      createdBy: session.user.id,
    });
  }

  return Response.json({ tickets });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["admin", "employee", "client"].includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const { title, description, priority, assignedTo, project: projectId } = await req.json();

  if (!title?.trim() || !description?.trim()) {
    return Response.json({ error: "Title and description are required" }, { status: 400 });
  }

  if (!projectId) {
    return Response.json({ error: "Project is required" }, { status: 400 });
  }

  const projectVisibilityQuery = buildProjectVisibilityQuery(session.user);

  if (!projectVisibilityQuery) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const accessibleProject = await Project.findOne({
    _id: projectId,
    ...projectVisibilityQuery,
  }).select("_id title");

  if (!accessibleProject) {
    return Response.json({ error: "You are not allowed to raise a ticket for this project" }, { status: 403 });
  }

  const payload = {
    title: title.trim(),
    description: description.trim(),
    priority:
      session.user.role === "client"
        ? "medium"
        : ["low", "medium", "high"].includes(priority)
          ? priority
          : "medium",
    createdBy: session.user.id,
            project: accessibleProject._id,
  };

  if (session.user.role === "employee") {
    payload.assignedTo = session.user.id;
  }

  if (session.user.role === "admin" && assignedTo) {
    const assignee = await User.findById(assignedTo);

    if (assignee && assignee.role === "employee") {
      payload.assignedTo = assignee._id;
    }
  }

  const ticket = await Ticket.create(payload);

  const populatedTicket = await Ticket.findById(ticket._id)
    .populate("createdBy", "name email role")
    .populate("assignedTo", "name email role")
    .populate("messages.sender", "name email role");

  const recipientIds = new Set();

  if (payload.createdBy) {
    recipientIds.add(payload.createdBy.toString());
  }

  if (payload.assignedTo) {
    recipientIds.add(payload.assignedTo.toString());
  }

  if (!payload.assignedTo) {
    const staffUsers = await User.find({ role: "admin" }).select("_id");
    for (const user of staffUsers) {
      const id = user._id?.toString?.();
      if (id) recipientIds.add(id);
    }
  }

  const recipients = Array.from(recipientIds);

  if (recipients.length) {
    emitToUsers(recipients, "ticket-updated", {
      ticket: populatedTicket,
      ticketId: populatedTicket._id?.toString?.() || populatedTicket._id,
      changeType: "created",
    });

    await notificationService.createAndEmitNotification({
      userIds: recipients,
      type: "ticket",
      title: "New ticket created",
      message: "New ticket created",
      text: "New ticket created",
      source: "ticket",
      payload: { ticketId: populatedTicket._id?.toString?.() || populatedTicket._id },
    });
  }

  return Response.json({ ticket: populatedTicket }, { status: 201 });
}