const { Server } = require("socket.io");
const { createRateLimitMiddleware } = require("./rate-limiter");
const { getLogger } = require("./logger");
const {
  validateMessage,
  validateReceiverId,
  validateTicketMessage,
  normalizeId,
} = require("./validators");
const notificationService = require("../notifications/notification-service");

let io;
const onlineUsers = new Map();
const logger = getLogger();
const rateLimiter = createRateLimitMiddleware();

function getCorsOptions() {
  const rawOrigins = process.env.SOCKET_CORS_ORIGIN || process.env.APP_URL || "";
  const origins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length > 0) {
    return {
      origin: origins.length === 1 ? origins[0] : origins,
      credentials: true,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return { origin: "*" };
  }

  return undefined;
}

// =========================
// HELPERS
// =========================

function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

function addUserSocket(userId, socketId) {
  const id = normalizeId(userId);
  if (!id || !socketId) return;

  const existing = onlineUsers.get(id);
  if (existing) {
    existing.add(socketId);
  } else {
    onlineUsers.set(id, new Set([socketId]));
  }
}

function removeUserSocket(userId, socketId) {
  const id = normalizeId(userId);
  if (!id || !socketId) return;

  const sockets = onlineUsers.get(id);
  if (!sockets) return;

  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(id);
  }
}

function getSocketIdsForUsers(userIds) {
  const socketIds = new Set();

  for (const userId of userIds || []) {
    const id = normalizeId(userId);
    if (!id) continue;

    const sockets = onlineUsers.get(id);
    if (!sockets?.size) continue;

    for (const socketId of sockets) {
      socketIds.add(socketId);
    }
  }

  return socketIds;
}

// =========================
// CORE FUNCTIONS
// =========================
function emitToUsers(userIds, eventName, payload) {
  if (io) {
    const targetSocketIds = getSocketIdsForUsers(userIds);
    if (!targetSocketIds.size) return false;

    for (const socketId of targetSocketIds) {
      io.to(socketId).emit(eventName, payload);
    }

    return true;
  }

  // If no in-process io instance (e.g., API running in serverless environment
  // and socket server is deployed separately), attempt to notify the external
  // socket server via its HTTP `/emit` endpoint. This lets serverless API
  // routes still trigger real-time events.
  try {
    const socketUrl = (process.env.NEXT_PUBLIC_SOCKET_URL || process.env.SOCKET_URL || "").replace(/\/$/, "");
    if (!socketUrl) return false;

    // fire-and-forget POST
    fetch(`${socketUrl}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIds,
        eventName,
        payload,
        secret: process.env.SOCKET_EMIT_SECRET || undefined,
      }),
    }).catch(() => {});

    return true;
  } catch (err) {
    return false;
  }
}

function getIO() {
  return io;
}

function initSocket(server) {
  const socketOptions = {
    transports: ["websocket", "polling"],
  };
  const corsOptions = getCorsOptions();

  if (corsOptions) {
    socketOptions.cors = corsOptions;
  }

  io = new Server(server, socketOptions);

  // ===== MIDDLEWARE =====
  io.use((socket, next) => {
    try {
      const userId =
        socket.handshake.auth?.userId ||
        socket.handshake.query?.userId ||
        socket.handshake.headers?.["x-user-id"] ||
        null;

      socket.userId = userId ? normalizeId(userId) : null;

      if (socket.userId) {
        logger.logConnection("info", socket.id, "auth_check_passed", { userId: socket.userId });
      } else {
        logger.logConnection("warn", socket.id, "auth_skipped", { reason: "missing_user_id" });
      }
      next();
    } catch (err) {
      logger.logError("AUTH", err, { socketId: socket.id });
      next(new Error("AUTHENTICATION_ERROR"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    logger.logConnection("info", socket.id, "connected", { userId });

    // ===== JOIN EVENT =====
    socket.on("join", (data, callback) => {
      try {
        const joinUserId = normalizeId(data?.userId || data);
        if (!joinUserId) {
          logger.logAuth("warn", userId, "join_failed", { reason: "invalid_user_id" });
          if (callback) callback({ ok: false, error: "Invalid user ID" });
          return;
        }

        socket.data.userId = joinUserId;
        addUserSocket(joinUserId, socket.id);

        const onlineUserIds = getOnlineUserIds();
        io.emit("online-users", onlineUserIds);

        logger.logAuth("info", joinUserId, "joined", { socketId: socket.id });
        if (callback) callback({ ok: true, onlineCount: onlineUserIds.length });
      } catch (err) {
        logger.logError("JOIN", err, { userId });
        if (callback) callback({ ok: false, error: "Join failed" });
      }
    });

    // ===== SEND MESSAGE EVENT =====
    socket.on("send-message", async (data, callback) => {
      try {
        // Check rate limit
        const rateCheckResult = rateLimiter.checkMessage(userId);
        if (!rateCheckResult.allowed) {
          logger.logRateLimit(userId, "send-message", rateCheckResult.remaining, rateCheckResult.resetAt);
          if (callback) {
            callback({
              ok: false,
              error: "Rate limit exceeded",
              resetAt: rateCheckResult.resetAt,
            });
          }
          return;
        }

        // Validate message
        const validation = validateMessage(data);
        if (!validation.valid) {
          logger.logValidationError(userId, "send-message", validation.errors, data);
          if (callback) callback({ ok: false, errors: validation.errors });
          return;
        }

        // Validate receiver
        const receiverValidation = validateReceiverId(
          data?.receiverId || data?.receiver
        );
        if (!receiverValidation.valid) {
          logger.logValidationError(userId, "send-message", receiverValidation.errors, data);
          if (callback) callback({ ok: false, errors: receiverValidation.errors });
          return;
        }

        const receiverId = receiverValidation.receiverId;

        // Prevent self-messaging
        if (userId === receiverId) {
          logger.logValidationError(userId, "send-message", ["Cannot message yourself"], data);
          if (callback) callback({ ok: false, error: "Cannot message yourself" });
          return;
        }

        // Prepare message payload
        const messagePayload = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: validation.text,
          senderId: userId,
          receiverId,
          timestamp: new Date().toISOString(),
          ...data, // Preserve other fields from original data
        };

        // Emit to receiver with acknowledgment
        const emitted = emitToUsers([receiverId], "receive-message", messagePayload);
        const notifications = await notificationService.persistNotifications({
          userIds: [receiverId],
          type: "chat",
          title: "New message",
          message: "New message",
          text: "New message",
          source: "chat",
          payload: { from: userId },
        });

        for (const notification of notifications) {
          emitToUsers([notification.userId], "notification", notification);
        }

        logger.logMessage("info", userId, "message_sent", {
          receiverId,
          msgId: messagePayload.id,
          emitted,
        });

        if (callback) callback({ ok: true, messageId: messagePayload.id });
      } catch (err) {
        logger.logError("SEND_MESSAGE", err, { userId });
        if (callback) callback({ ok: false, error: "Send failed" });
      }
    });

    // ===== TICKET MESSAGE EVENT =====
    socket.on("ticket-message", async (data, callback) => {
      try {
        // Check rate limit (separate bucket for tickets)
        const rateCheckResult = rateLimiter.checkTicket(userId);
        if (!rateCheckResult.allowed) {
          logger.logRateLimit(userId, "ticket-message", rateCheckResult.remaining, rateCheckResult.resetAt);
          if (callback) {
            callback({
              ok: false,
              error: "Rate limit exceeded",
              resetAt: rateCheckResult.resetAt,
            });
          }
          return;
        }

        // Validate ticket message
        const validation = validateTicketMessage(data);
        if (!validation.valid) {
          logger.logValidationError(userId, "ticket-message", validation.errors, data);
          if (callback) callback({ ok: false, errors: validation.errors });
          return;
        }

        const receiverId = validation.receiverId;
        const ticketId = validation.ticketId;

        // Prepare ticket message payload
        const ticketPayload = {
          id: `tmsg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: validation.text,
          senderId: userId,
          receiverId,
          ticketId,
          timestamp: new Date().toISOString(),
        };

        // Emit to receiver
        const emitted = emitToUsers([receiverId], "ticket-message", ticketPayload);
        const notifications = await notificationService.persistNotifications({
          userIds: [receiverId],
          type: "ticket",
          title: "New ticket update",
          message: "New ticket update",
          text: "New ticket update",
          source: "ticket",
          payload: { ticketId, from: userId },
        });

        for (const notification of notifications) {
          emitToUsers([notification.userId], "notification", notification);
        }

        logger.logMessage("info", userId, "ticket_message_sent", {
          receiverId,
          ticketId,
          msgId: ticketPayload.id,
          emitted,
        });

        if (callback) callback({ ok: true, messageId: ticketPayload.id });
      } catch (err) {
        logger.logError("TICKET_MESSAGE", err, { userId });
        if (callback) callback({ ok: false, error: "Send failed" });
      }
    });

    // ===== DISCONNECT EVENT =====
    socket.on("disconnect", (reason) => {
      try {
        if (socket.data.userId) {
          removeUserSocket(socket.data.userId, socket.id);
        } else {
          for (const [uid, socketIds] of onlineUsers.entries()) {
            if (socketIds.has(socket.id)) {
              removeUserSocket(uid, socket.id);
              break;
            }
          }
        }

        io.emit("online-users", getOnlineUserIds());
        logger.logConnection("info", socket.id, "disconnected", { userId, reason });
      } catch (err) {
        logger.logError("DISCONNECT", err, { userId, socketId: socket.id });
      }
    });

    // ===== ERROR HANDLER =====
    socket.on("error", (err) => {
      logger.logError("SOCKET", err, { userId, socketId: socket.id });
    });
  });

  return io;
}

// =========================
// EXPORT (CommonJS)
// =========================
module.exports = {
  initSocket,
  getIO,
  emitToUsers,
};