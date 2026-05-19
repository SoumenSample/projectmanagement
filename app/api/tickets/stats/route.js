import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Ticket from "@/lib/models/Ticket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  return Response.json({
    total: await Ticket.countDocuments(),
    open: await Ticket.countDocuments({ status: "open" }),
    progress: await Ticket.countDocuments({ status: "in-progress" }),
    closed: await Ticket.countDocuments({ status: "closed" }),
    high: await Ticket.countDocuments({ priority: "high" }),
    unassigned: await Ticket.countDocuments({ assignedTo: null, status: { $ne: "closed" } }),
  });
}