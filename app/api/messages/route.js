import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import { emitToUsers } from "@/lib/socket/server";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, text } = await req.json();

  if (!receiverId || !text?.trim()) {
    return Response.json({ error: "receiverId and text are required" }, { status: 400 });
  }

  await connectToDatabase();

  const sender = await User.findById(session.user.id);
  const receiver = await User.findById(receiverId);

  if (!sender || !receiver) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Block role combinations that should not chat directly.
  if (
    (sender.role === "client" && receiver.role === "employee") ||
    (sender.role === "employee" && receiver.role === "client") ||
    (sender.role === "vendor" && !["admin", "vendor"].includes(receiver.role)) ||
    (receiver.role === "vendor" && !["admin", "vendor"].includes(sender.role))
  ) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  let convo = await Conversation.findOne({
    participants: { $all: [sender._id, receiver._id] },
  });

  if (!convo) {
    convo = await Conversation.create({
      participants: [sender._id, receiver._id],
    });
  }

 
  const message = await Message.create({
    conversationId: convo._id,
    sender: sender._id,
    receiver: receiver._id,
    text: text.trim(),
  });

  emitToUsers([receiver._id], "receive-message", message);
  await notificationService.createAndEmitNotification({
    userIds: [receiver._id],
    type: "chat",
    title: "New message",
    message: "New message",
    text: "New message",
    source: "chat",
  });

  // Fallback: if the socket server runs as a separate process (e.g., on Render),
  // POST to the socket server `/emit` endpoint so it can forward the event.
  // This is useful in production where `emitToUsers` may be a no-op.
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL.replace(/\/$/, "");

      // send receive-message
      await fetch(`${socketUrl}/emit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: [receiver._id?.toString?.() || receiver._id],
          eventName: "receive-message",
          payload: message,
          secret: process.env.SOCKET_EMIT_SECRET || undefined,
        }),
      }).catch(() => {})
    } catch (err) {
      // swallow errors - failure to notify socket server shouldn't block message creation
    }
  }

  return Response.json({ message });
}