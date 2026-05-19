import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import mongoose from "mongoose";

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ messages: [] });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return Response.json({ messages: [] });
  }

  await connectToDatabase();

  const convo = await Conversation.findOne({
    participants: { $all: [session.user.id, userId] },
  });

  if (!convo) return Response.json({ messages: [] });

  await Message.updateMany(
    {
      conversationId: convo._id,
      receiver: session.user.id,
      seen: false,
    },
    { $set: { seen: true } }
  );

  const messages = await Message.find({
    conversationId: convo._id,
  }).sort({ createdAt: 1 });

  return Response.json({ messages });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return Response.json({ error: "Invalid userId" }, { status: 400 });
  }

  await connectToDatabase();

  const convo = await Conversation.findOne({
    participants: { $all: [session.user.id, userId] },
  });

  if (!convo) {
    return Response.json({ success: true, deleted: false });
  }

  await Message.deleteMany({ conversationId: convo._id });
  await Conversation.deleteOne({ _id: convo._id });

  return Response.json({ success: true, deleted: true });
}