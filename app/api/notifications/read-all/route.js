import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await notificationService.markAllNotificationsRead({
      userId: session.user.id,
    });

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/notifications/read-all error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
