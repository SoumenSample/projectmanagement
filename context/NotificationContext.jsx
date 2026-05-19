"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";

const NotificationContext = createContext();
const STORAGE_KEY = "cyberspaceworks.notifications";

function isPersistedNotificationId(id) {
  const value = String(id || "");
  return value && !value.startsWith("temp-") && !value.startsWith("local-");
}

function toIsoTimestamp(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeNotification(notification = {}) {
  const resolvedId = notification.id ?? notification._id ?? `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sourceValue = notification.source ?? notification.sourceTab ?? notification.tab ?? notification.module ?? "";
  const readValue = Boolean(notification.read ?? notification.isRead);

  return {
    ...notification,
    id: String(resolvedId),
    timestamp: toIsoTimestamp(notification.timestamp ?? notification.createdAt ?? Date.now()),
    read: readValue,
    isRead: readValue,
    autoClose: notification.autoClose === true,
    expiresAt: notification.expiresAt ? Number(notification.expiresAt) : null,
    title: notification.title || "Notification",
    message: notification.message || notification.text || "",
    type: notification.type || "info",
    route: notification.route || notification.path || notification.url || notification.href || "",
    sourceTab: sourceValue || null,
    source: sourceValue || null,
    persisted: notification.persisted ?? isPersistedNotificationId(resolvedId),
  };
}

function loadStoredNotifications() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeNotification);
  } catch {
    return [];
  }
}

function mergeNotifications(primary = [], secondary = []) {
  const merged = [];
  const seen = new Set();

  const addNotification = (notification) => {
    const normalized = normalizeNotification(notification);
    if (!normalized.id || seen.has(normalized.id)) {
      return;
    }

    seen.add(normalized.id);
    merged.push(normalized);
  };

  primary.forEach(addNotification);
  secondary.forEach(addNotification);

  merged.sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
  return merged;
}

export function NotificationProvider({ children }) {
  const { status } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const timersRef = useRef(new Map());
  const notificationsRef = useRef([]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Ignore storage failures and keep notifications in memory.
    }
  }, [notifications]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (status === "unauthenticated") {
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
      timersRef.current.clear();
      setNotifications([]);
      setIsLoading(false);

      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore cache cleanup failures.
      }

      return;
    }

    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    async function syncNotifications() {
      setIsLoading(true);

      const cachedNotifications = loadStoredNotifications();
      if (cachedNotifications.length > 0) {
        setNotifications((prev) => mergeNotifications(cachedNotifications, prev));
      }

      try {
        const response = await fetch("/api/notifications?page=1&limit=50", {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            if (!cancelled) {
              setNotifications([]);
            }
            return;
          }

          throw new Error(`Failed to load notifications (${response.status})`);
        }

        const data = await response.json();
        const serverNotifications = Array.isArray(data?.notifications)
          ? data.notifications.map(normalizeNotification)
          : [];

        if (!cancelled) {
          setNotifications((prev) => mergeNotifications(serverNotifications, prev));
        }
      } catch (error) {
        console.error("Failed to load notifications", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void syncNotifications();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const removeNotification = useCallback(async (id) => {
    if (!id) {
      return;
    }

    const target = notificationsRef.current.find((notification) => String(notification.id) === String(id));
    const previousNotifications = notificationsRef.current;

    const timerId = timersRef.current.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timersRef.current.delete(id);
    }

    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (!target?.persisted) {
      return;
    }

    try {
      const response = await fetch("/api/notifications/delete", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId: id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }
    } catch {
      setNotifications(previousNotifications);
    }
  }, []);

  useEffect(() => {
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current.clear();

    const now = Date.now();

    notifications.forEach((notification) => {
      // Never auto-remove unread notifications.
      if (
        !notification.read ||
        notification.autoClose === false ||
        !notification.expiresAt
      ) {
        return;
      }

      const delay = Number(notification.expiresAt) - now;
      if (delay <= 0) {
        return;
      }

      const timerId = setTimeout(() => {
        removeNotification(notification.id);
      }, delay);

      timersRef.current.set(notification.id, timerId);
    });

    return () => {
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
      timersRef.current.clear();
    };
  }, [notifications, removeNotification]);

  const addNotification = useCallback((notification) => {
    const id = notification?.id ?? `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newNotification = normalizeNotification({
      ...notification,
      id,
      timestamp: notification?.timestamp || notification?.createdAt || new Date().toISOString(),
      persisted: notification?.persisted ?? isPersistedNotificationId(id),
      read: Boolean(notification?.read ?? notification?.isRead),
    });

    setNotifications((prev) => [
      newNotification,
      ...prev.filter((existing) => String(existing.id) !== String(newNotification.id)),
    ]);

    return newNotification.id;
  }, []);

  const markAsRead = useCallback(async (id) => {
    if (!id) {
      return;
    }

    const target = notificationsRef.current.find((notification) => String(notification.id) === String(id));
    const previousNotifications = notificationsRef.current;

    setNotifications((prev) =>
      prev.map((n) => {
        if (String(n.id) !== String(id)) {
          return n;
        }

        return {
          ...n,
          read: true,
          isRead: true,
          expiresAt:
            n.autoClose === true && !n.expiresAt ? Date.now() + 5000 : n.expiresAt,
        };
      })
    );

    if (!target?.persisted) {
      return;
    }

    try {
      const response = await fetch("/api/notifications/read", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId: id }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
    } catch {
      setNotifications(previousNotifications);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const previousNotifications = notificationsRef.current;
    const hasPersistedNotifications = previousNotifications.some((notification) => notification.persisted);

    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read: true,
        isRead: true,
        expiresAt:
          n.autoClose === true && !n.expiresAt ? Date.now() + 5000 : n.expiresAt,
      }))
    );

    if (!hasPersistedNotifications) {
      return;
    }

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
    } catch {
      setNotifications(previousNotifications);
    }
  }, []);

  const clearAll = useCallback(async () => {
    const previousNotifications = notificationsRef.current;
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current.clear();
    setNotifications([]);

    const hasPersistedNotifications = previousNotifications.some((notification) => notification.persisted);
    if (!hasPersistedNotifications) {
      return;
    }

    try {
      const response = await fetch("/api/notifications/delete-all", {
        method: "PATCH",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to clear notifications");
      }
    } catch {
      setNotifications(previousNotifications);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}
