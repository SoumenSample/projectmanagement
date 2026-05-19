"use client";

import React, { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { MdClose, MdCheckCircle, MdInfo, MdWarning, MdError } from "react-icons/md";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useNotifications } from "@/context/NotificationContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

function resolveSocketUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    return "";
  }

  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5000";
  }

  return window.location.origin;
}

const NotificationCenter = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount,
    isLoading,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return undefined;

    const socketUrlToUse = resolveSocketUrl();

    const socket = io(socketUrlToUse, {
      transports: ["websocket", "polling"],
      auth: {
        userId,
        // token can be added here if using JWT
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.emit("join", { userId }, (response) => {
      if (response?.ok) {
        console.debug("[socket] Joined notification center successfully");
      } else {
        console.error("[socket] Join failed:", response?.error);
      }
    });

    socket.on("connect", () => {
      console.debug("[socket] connected", socket.id, "userId=", userId);
      // Rejoin on reconnect
      socket.emit("join", { userId });
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error", err);
    });

    socket.on("disconnect", (reason) => {
      console.warn("[socket] disconnected", reason);
    });

    socket.on("notification", (payload) => {
      console.debug("[socket] notification received", payload);
      const type = payload?.type || "info";
      const titleByType = {
        chat: "New chat message",
        ticket: "Ticket update",
        project: "Project update",
        lead: "New lead",
        user: "User activity",
        request: "New request",
        payment: "Payment update",
      };

      addNotification({
        id: payload?.id,
        type,
        title: payload?.title || titleByType[type] || "Notification",
        message: payload?.message || payload?.text || "You have a new update.",
        route:
          payload?.route ||
          payload?.path ||
          payload?.url ||
          payload?.href ||
          null,
        sourceTab: payload?.sourceTab || payload?.source || payload?.tab || payload?.module || null,
        source: payload?.source || payload?.sourceTab || payload?.tab || payload?.module || null,
        timestamp: payload?.timestamp || payload?.createdAt || new Date().toISOString(),
        read: Boolean(payload?.isRead || payload?.read),
        persisted: payload?.persisted ?? true,
        autoClose: false,
      });
    });

    return () => {
      socket.off("notification");
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [addNotification, session?.user?.id]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <MdCheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <MdError className="w-5 h-5 text-red-500" />;
      case "warning":
        return <MdWarning className="w-5 h-5 text-yellow-500" />;
      case "info":
      default:
        return <MdInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type, read) => {
    if (read) return "bg-gray-50 dark:bg-gray-800";
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/10";
      case "error":
        return "bg-red-50 dark:bg-red-900/10";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/10";
      case "info":
      default:
        return "bg-blue-50 dark:bg-blue-900/10";
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds} seconds ago`;
    if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

    return new Date(timestamp).toLocaleDateString();
  };

  const inferTabKey = (notification) => {
    const normalize = (value) =>
      String(value || "")
        .toLowerCase()
        .trim();

    const sourceTab = normalize(notification?.sourceTab);
    if (sourceTab) {
      return sourceTab;
    }

    const route = normalize(notification?.route);
    if (route.includes("/schedule")) return "schedule";
    if (route.includes("/payment")) return "payment";
    if (route.includes("/billing")) return "billing";
    if (route.includes("/contract")) return "contract";
    if (route.includes("/ticket")) return "ticket";
    if (route.includes("/project")) return "project";
    if (route.includes("/message") || route.includes("/chat")) return "chat";
    if (route.includes("/lead")) return "lead";
    if (route.includes("/client")) return "client";
    if (route.includes("/user")) return "user";

    const haystack = `${normalize(notification?.title)} ${normalize(notification?.message)} ${normalize(notification?.type)}`;

    if (/(schedule|meeting|appointment|calendar)/.test(haystack)) return "schedule";
    if (/(billing|invoice)/.test(haystack)) return "billing";
    if (/(payment|paid|transaction)/.test(haystack)) return "payment";
    if (/(ticket|support|issue|case)/.test(haystack)) return "ticket";
    if (/(project|milestone|task|delivery)/.test(haystack)) return "project";
    if (/(message|chat|conversation|sms)/.test(haystack)) return "chat";
    if (/(lead|enquiry|inquiry)/.test(haystack)) return "lead";
    if (/(client|customer)/.test(haystack)) return "client";
    if (/(user|account|profile)/.test(haystack)) return "user";

    return "";
  };

  const getViewRoute = (notification) => {
    const routesByType = {
      chat: "/dashboard/messages",
      ticket: "/dashboard/tickets",
      project: "/dashboard/projects",
      lead: "/dashboard/leads",
      user: "/dashboard/users",
      request: "/dashboard/clients",
      payment: "/dashboard/client/payment",
      billing: "/dashboard/client/billing",
      schedule: "/schedule",
      contract: "/dashboard/client/contracts",
      info: "/dashboard",
      warning: "/dashboard",
      success: "/dashboard",
      error: "/dashboard",
    };

    const routesByTab = {
      messages: "/dashboard/messages",
      chat: "/dashboard/messages",
      tickets: "/dashboard/tickets",
      ticket: "/dashboard/tickets",
      projects: "/dashboard/projects",
      project: "/dashboard/projects",
      leads: "/dashboard/leads",
      lead: "/dashboard/leads",
      users: "/dashboard/users",
      user: "/dashboard/users",
      clients: "/dashboard/clients",
      client: "/dashboard/clients",
      billing: "/dashboard/client/billing",
      payments: "/dashboard/client/payment",
      payment: "/dashboard/client/payment",
      schedule: "/schedule",
      contract: "/dashboard/client/contracts",
    };

    const sourceTab = inferTabKey(notification);
    if (sourceTab && routesByTab[sourceTab]) {
      return getPanelRoute(sourceTab) || routesByTab[sourceTab];
    }

    const directRoute = notification?.route;
    if (
      typeof directRoute === "string" &&
      directRoute.startsWith("/") &&
      directRoute !== "/" &&
      directRoute !== "/dashboard"
    ) {
      return directRoute;
    }

    const notificationType =
      typeof notification?.type === "string"
        ? notification.type.toLowerCase().trim()
        : "";

    return routesByType[notificationType] || "/dashboard";
  };

  const handleViewNotification = (notification, e) => {
    e.stopPropagation();
    markAsRead(notification.id);
    setIsOpen(false);
    router.push(getViewRoute(notification));
  };

  const getViewButtonLabel = (notification) => {
    const source = inferTabKey(notification) || notification?.sourceTab || notification?.type || "Details";
    const normalized = String(source)
      .replace(/[-_]+/g, " ")
      .trim()
      .toLowerCase();

    const prettyName = normalized
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    if (["info", "warning", "success", "error"].includes(prettyName.toLowerCase())) {
      return "Details";
    }

    return prettyName || "Details";
  };

  const getCurrentPanel = () => {
    const currentPath = pathname || "";

    if (currentPath.includes("/dashboard/admin")) {
      return "admin";
    }

    if (currentPath.includes("/dashboard/employee")) {
      return "employee";
    }

    if (currentPath.includes("/dashboard/client")) {
      return "client";
    }

    const role = session?.user?.role;
    if (role === "admin" || role === "employee" || role === "client") {
      return role;
    }

    return "client";
  };

  const getPanelRoute = (tabKey) => {
    const panel = getCurrentPanel();

    const routes = {
      payment: {
        admin: "/dashboard/admin/payment",
        client: "/dashboard/client/payment",
        employee: "/dashboard/employee",
      },
      contract: {
        admin: "/dashboard/admin/contracts",
        client: "/dashboard/client/contracts",
        employee: "/dashboard/employee/contracts",
      },
      billing: {
        admin: "/dashboard/admin/billing",
        client: "/dashboard/client/billing",
        employee: "/dashboard/employee",
      },
      schedule: {
        admin: "/schedule",
        client: "/schedule",
        employee: "/schedule",
      },
      project: {
        admin: "/dashboard/admin/projects",
        client: "/dashboard/client/projects",
        employee: "/dashboard/employee/projects",
      },
      ticket: {
        admin: "/dashboard/tickets",
        client: "/dashboard/tickets",
        employee: "/dashboard/tickets",
      },
      chat: {
        admin: "/dashboard/messages",
        client: "/dashboard/messages",
        employee: "/dashboard/messages",
      },
      lead: {
        admin: "/dashboard/admin/leads",
        client: "/dashboard/clients",
        employee: "/dashboard/employee",
      },
      user: {
        admin: "/dashboard/admin/users",
        client: "/dashboard/client",
        employee: "/dashboard/employee",
      },
    };

    return routes[tabKey]?.[panel] || "";
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 text-foreground hover:bg-accent rounded-lg transition-colors">
          <FaBell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-sm font-semibold text-foreground">
            Notifications
          </h2>
          {isLoading ? (
            <span className="text-xs text-muted-foreground">Syncing...</span>
          ) : notifications.length > 0 ? (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  disabled={isLoading}
                  onClick={() => {
                    markAllAsRead();
                  }}
                >
                  Mark all read
                </Button>
              )}
            </div>
          ) : null}
        </div>

        {/* Notifications List */}
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-10 w-10 rounded-full border-2 border-muted-foreground/20 border-t-foreground animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading notifications</p>
            <p className="text-xs text-muted-foreground mt-1">
              Fetching your latest activity
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FaBell className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              We'll let you know when something arrives
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-0">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b last:border-b-0 transition-colors hover:bg-accent/50 ${getNotificationBgColor(
                    notification.type,
                    notification.read
                  )}`}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 pt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium ${
                            notification.read
                              ? "text-muted-foreground"
                              : "text-foreground font-semibold"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            title={notification.read ? "Marked as read" : "Mark as read"}
                            className={`transition-colors ${
                              notification.read
                                ? "text-green-600"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <MdCheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          >
                            <MdClose className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {!notification.read && notification.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-2 py-1 text-xs bg-muted text-foreground hover:bg-muted/80 dark:bg-muted/70 dark:hover:bg-muted/90"
                          onClick={(e) => handleViewNotification(notification, e)}
                        >
                          {getViewButtonLabel(notification)} <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isLoading}
              onClick={() => clearAll()}
            >
              Clear all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;
