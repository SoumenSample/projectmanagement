import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Message from "@/lib/models/Message";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ users: [] });
    }

    await connectToDatabase();

    const current = await User.findById(session.user.id);

    let users;

    if (current.role === "admin") {
      users = await User.find({ _id: { $ne: current._id } });
    } else if (current.role === "employee") {
      users = await User.find({
        role: { $in: ["admin", "employee"] },
        _id: { $ne: current._id },
      });
    } else {
      users = await User.find({
        role: "admin",
        _id: { $ne: current._id },
      });
    }

    const usersWithUnread = await Promise.all(
      users.map(async (u) => {
        const unread = await Message.countDocuments({
          sender: u._id,
          receiver: current._id,
          seen: false,
        });

        const userObj = u.toObject();
        return {
          _id: userObj._id,
          name: userObj.name,
          email: userObj.email,
          role: userObj.role,
          unread,
        };
      })
    );

    return Response.json({ users: usersWithUnread });

  } catch (err) {
    console.error(err);
    return Response.json({ users: [] });
  }
}