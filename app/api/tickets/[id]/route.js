import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Ticket from "@/lib/models/Ticket";
import User from "@/lib/models/User";
import { sendTicketEmail } from "@/lib/email/sendTicketEmail";
import { emitToUsers } from "@/lib/socket/server";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toId(value) {
  return value ? value.toString() : null;
}

async function loadTicket(ticketId) {
  return Ticket.findById(ticketId)
    .populate("createdBy", "name email role")
    .populate("assignedTo", "name email role")
    .populate("project", "title client assignedEmployees")
    .populate("messages.sender", "name email role");
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { message, file, status, priority, assignedTo } = await req.json();

    const ticket = await Ticket.findById(params.id);

    if (!ticket) {
      return Response.json({ error: "Ticket not found" }, { status: 404 });
    }

    const currentUserId = toId(session.user.id);
    const createdById = toId(ticket.createdBy);
    const assignedToId = toId(ticket.assignedTo);
    const isAdmin = session.user.role === "admin";
    const isEmployee = session.user.role === "employee";
    const isClient = session.user.role === "client";
    const isOwner = createdById === currentUserId;
    const isAssignee = assignedToId === currentUserId;

    const canAccessTicket =
      isAdmin ||
      (isClient && isOwner) ||
      (isEmployee && (isAssignee || isOwner || !assignedToId));

    if (!canAccessTicket) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // =========================
    // ADD MESSAGE
    // =========================
    let newMessage = null;

    if (message || file) {
      newMessage = {
        sender: session.user.id,
        text: message,
        file,
      };

      ticket.messages.push(newMessage);

      if (ticket.status === "closed" && (isClient || isEmployee)) {
        ticket.status = "open";
      } else if ((isEmployee || isAdmin) && ticket.status === "open") {
        ticket.status = "in-progress";
      }
    }

    // =========================
    // UPDATE FIELDS
    // =========================
    if (isAdmin || (isEmployee && (isAssignee || !assignedToId))) {
      if (["open", "in-progress", "closed"].includes(status)) {
        ticket.status = status;
      }

      if (isAdmin && ["low", "medium", "high"].includes(priority)) {
        ticket.priority = priority;
      }

      if (isAdmin && assignedTo !== undefined) {
        if (assignedTo === null || assignedTo === "") {
          ticket.assignedTo = null;
        } else {
          const assignee = await User.findById(assignedTo);

          if (assignee && assignee.role === "employee") {
            ticket.assignedTo = assignee._id;
          }
        }
      }

      if (
        isEmployee &&
        !ticket.assignedTo &&
        assignedTo === currentUserId
      ) {
        ticket.assignedTo = currentUserId;
        ticket.status = "in-progress";
      }
    } else if (assignedTo !== undefined || status || priority) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await ticket.save();

    const updatedTicket = await loadTicket(ticket._id);
    const updatedTicketId = updatedTicket._id?.toString?.() || updatedTicket._id;

    const recipientSet = new Set();

    const updatedCreatedById = updatedTicket.createdBy?._id?.toString?.() || updatedTicket.createdBy?.toString?.();
    const assignedUserId = updatedTicket.assignedTo?._id?.toString?.() || updatedTicket.assignedTo?.toString?.();

    if (updatedCreatedById) recipientSet.add(updatedCreatedById);
    if (assignedUserId) recipientSet.add(assignedUserId);

    if (!assignedUserId && session.user.role === "client") {
      const admins = await User.find({ role: "admin" }).select("_id");
      for (const admin of admins) {
        const adminId = admin._id?.toString?.();
        if (adminId) recipientSet.add(adminId);
      }
    }

    if (recipientSet.size) {
      const recipients = Array.from(recipientSet);

      emitToUsers(recipients, "ticket-updated", {
        ticket: updatedTicket,
        ticketId: updatedTicketId,
        changeType: newMessage ? "message" : "status",
      });

      await notificationService.createAndEmitNotification({
        userIds: recipients,
        type: "ticket",
        title: newMessage ? "New ticket message" : "Ticket updated",
        message: newMessage ? "New ticket message" : "Ticket updated",
        text: newMessage ? "New ticket message" : "Ticket updated",
        source: "ticket",
        payload: { ticketId: updatedTicketId },
      });
    }

    // =========================
    // EMAIL NOTIFICATION
    // =========================
    try {
      if (newMessage) {
        const sender = await User.findById(session.user.id);

        let receiverId;

        // 🎯 decide receiver
        if (session.user.role === "client") {
          receiverId = ticket.assignedTo;
          if (!receiverId) {
            const adminUser = await User.findOne({ role: "admin" });
            receiverId = adminUser?._id;
          }
        } else {
          receiverId = ticket.createdBy;
        }

        if (receiverId) {
          const receiver = await User.findById(receiverId);

          // ❗ prevent sending email to self
          if (receiver && receiver.email !== sender.email) {
            await sendTicketEmail({
              to: receiver.email,
              subject: `Ticket Update: ${ticket.title}`,
              html: `
                <div style="font-family:Arial;padding:10px">
                  <h2>Ticket Updated</h2>

                  <p><b>Ticket:</b> ${ticket.title}</p>
                  <p><b>From:</b> ${sender.name}</p>

                  <p><b>Message:</b></p>
                  <blockquote style="background:#f5f5f5;padding:10px;border-left:4px solid #0ebac7">
                    ${message || "File attached"}
                  </blockquote>

                  ${
                    file
                      ? `<p><a href="${process.env.NEXTAUTH_URL}${file}">📎 View Attachment</a></p>`
                      : ""
                  }

                  <hr/>
                  <p style="font-size:12px;color:#777">
                    Login to reply to this ticket.
                  </p>
                </div>
              `,
            });
          }
        }
      }
    } catch (err) {
      console.error("Ticket email error:", err);
    }

    return Response.json({ ticket: updatedTicket });

  } catch (err) {
    console.error("Ticket update error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}