"use client";

import { useNotification } from "@/hooks/useNotification";
import { Button } from "@/components/ui/button";

export default function NotificationTester() {
  const notify = useNotification();

  return (
    <div className="rounded-lg border p-6 bg-card">
      <h3 className="text-lg font-semibold mb-4">🔔 Test Notifications</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Click a button below to test notifications. Check the bell icon in the header!
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() =>
            notify.success("Success!", "This is a success notification")
          }
          className="bg-green-600 hover:bg-green-700"
        >
          Success Notification
        </Button>

        <Button
          onClick={() =>
            notify.error("Error!", "This is an error notification")
          }
          className="bg-red-600 hover:bg-red-700"
        >
          Error Notification
        </Button>

        <Button
          onClick={() =>
            notify.info("Info", "This is an informational notification")
          }
          className="bg-blue-600 hover:bg-blue-700"
        >
          Info Notification
        </Button>

        <Button
          onClick={() =>
            notify.warning("Warning!", "This is a warning notification")
          }
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          Warning Notification
        </Button>

        <Button
          onClick={() => {
            notify.info(
              "Persistent Notification",
              "This notification won't auto-close",
              false
            );
          }}
          variant="outline"
        >
          Persistent Notification
        </Button>
      </div>
    </div>
  );
}
