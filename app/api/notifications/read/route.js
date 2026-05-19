import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const notificationId = body?.notificationId || body?.id;

    if (!notificationId) {
      return Response.json({ error: "notificationId is required" }, { status: 400 });
    }

    const notification = await notificationService.markNotificationRead({
      userId: session.user.id,
      notificationId,
    });

    if (!notification) {
      return Response.json({ error: "Notification not found" }, { status: 404 });
    }

    return Response.json({ notification }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/notifications/read error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
