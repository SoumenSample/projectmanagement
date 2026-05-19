import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || 1;
    const limit = searchParams.get("limit") || 20;

    try {
      const result = await notificationService.listNotificationsForUser({
        userId: session.user.id,
        page,
        limit,
      });

      return Response.json(result, { status: 200 });
    } catch (err) {
      console.error("notificationService.listNotificationsForUser error:", err);

      // Fail open: return an empty but valid response so the UI can continue to function
      const safePage = Math.max(1, Number(page) || 1);
      const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

      return Response.json({
        notifications: [],
        total: 0,
        page: safePage,
        limit: safeLimit,
        totalPages: 1,
        hasMore: false,
      }, { status: 200 });
    }
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
