const mongoose = require("mongoose");
const Notification = require("../models/Notification");

let cachedConnection = global.__notificationMongoose;

if (!cachedConnection) {
  cachedConnection = global.__notificationMongoose = { conn: null, promise: null };
}

function getSocketServer() {
  return require("../socket/server");
}

function normalizeUserIds(userIds) {
  return Array.from(
    new Set(
      (Array.isArray(userIds) ? userIds : [userIds])
        .map((value) => value?.toString?.() || value)
        .filter(Boolean)
    )
  );
}

function toText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function buildTitle(type, title) {
  const normalizedTitle = toText(title);
  if (normalizedTitle) {
    return normalizedTitle;
  }

  const titlesByType = {
    chat: "New chat message",
    ticket: "Ticket update",
    project: "Project update",
    lead: "Lead update",
    user: "User update",
    request: "Request update",
    payment: "Payment update",
    billing: "Billing update",
    schedule: "Schedule update",
    contract: "Contract update",
    success: "Notification",
    warning: "Notification",
    error: "Notification",
    info: "Notification",
  };

  return titlesByType[String(type || "").toLowerCase()] || "Notification";
}

function buildMessage(message, text) {
  const normalizedMessage = toText(message);
  if (normalizedMessage) {
    return normalizedMessage;
  }

  return toText(text);
}

function buildRoute(route, payload) {
  const candidate = route || payload?.path || payload?.url || payload?.href || "";
  return toText(candidate);
}

function buildSource(source, payload) {
  const candidate = source || payload?.sourceTab || payload?.tab || payload?.module || "";
  return toText(candidate);
}

function toClientNotification(notification) {
  if (!notification) return null;

  const createdAt = notification.createdAt ? new Date(notification.createdAt) : new Date();
  const id = notification._id?.toString?.() || notification.id?.toString?.() || "";

  return {
    id,
    userId: notification.userId?.toString?.() || notification.userId || "",
    title: notification.title || "Notification",
    message: notification.message || "",
    type: notification.type || "info",
    route: notification.route || "",
    source: notification.source || "",
    sourceTab: notification.source || "",
    read: Boolean(notification.isRead),
    isRead: Boolean(notification.isRead),
    isDeleted: Boolean(notification.isDeleted),
    timestamp: createdAt.toISOString(),
    createdAt: createdAt.toISOString(),
  };
}

async function connectToNotificationDatabase() {
  if (cachedConnection.conn) {
    return cachedConnection.conn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }

  if (!cachedConnection.promise) {
    cachedConnection.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cachedConnection.conn = await cachedConnection.promise;
  return cachedConnection.conn;
}

async function persistNotifications({
  userIds,
  title,
  message,
  type = "info",
  route = "",
  source = "",
  text,
  payload = {},
}) {
  const normalizedUserIds = normalizeUserIds(userIds);
  if (!normalizedUserIds.length) {
    return [];
  }

  await connectToNotificationDatabase();

  const documents = normalizedUserIds.map((userId) => ({
    userId,
    title: buildTitle(type, title),
    message: buildMessage(message, text),
    type: toText(type) || "info",
    route: buildRoute(route, payload),
    source: buildSource(source, payload),
  }));

  const created = await Notification.insertMany(documents, { ordered: true });
  return created.map(toClientNotification).filter(Boolean);
}

async function createAndEmitNotification({
  userIds,
  title,
  message,
  type = "info",
  route = "",
  source = "",
  text,
  payload = {},
}) {
  const createdNotifications = await persistNotifications({
    userIds,
    title,
    message,
    type,
    route,
    source,
    text,
    payload,
  });

  if (!createdNotifications.length) {
    return [];
  }

  const { emitToUsers } = getSocketServer();

  for (const notification of createdNotifications) {
    emitToUsers([notification.userId], "notification", notification);
  }

  return createdNotifications;
}

async function listNotificationsForUser({ userId, page = 1, limit = 20 }) {
  await connectToNotificationDatabase();

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const filter = {
    userId,
    isDeleted: false,
  };

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications: notifications.map(toClientNotification).filter(Boolean),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    hasMore: safePage * safeLimit < total,
  };
}

async function markNotificationRead({ userId, notificationId }) {
  await connectToNotificationDatabase();

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId, isDeleted: false },
    { $set: { isRead: true } },
    { new: true }
  ).lean();

  return toClientNotification(notification);
}

async function markAllNotificationsRead({ userId }) {
  await connectToNotificationDatabase();

  const result = await Notification.updateMany(
    { userId, isDeleted: false, isRead: false },
    { $set: { isRead: true } }
  );

  return {
    modifiedCount: result.modifiedCount || 0,
  };
}

async function softDeleteNotification({ userId, notificationId }) {
  await connectToNotificationDatabase();

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  ).lean();

  return toClientNotification(notification);
}

async function softDeleteAllNotifications({ userId }) {
  await connectToNotificationDatabase();

  const result = await Notification.updateMany(
    { userId, isDeleted: false },
    { $set: { isDeleted: true } }
  );

  return {
    modifiedCount: result.modifiedCount || 0,
  };
}

module.exports = {
  connectToNotificationDatabase,
  createAndEmitNotification,
  persistNotifications,
  listNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  softDeleteNotification,
  softDeleteAllNotifications,
  toClientNotification,
  normalizeUserIds,
};
