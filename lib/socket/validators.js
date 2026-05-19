const mongoose = require("mongoose");

/**
 * Validates message input
 */
function validateMessage(data) {
  const errors = [];

  if (!data) {
    errors.push("Message data is required");
    return { valid: false, errors };
  }

  const text = data?.text || data?.content || "";

  // Check if text exists and is string
  if (typeof text !== "string") {
    errors.push("Message text must be a string");
  }

  // Check length
  if (!text || text.trim().length === 0) {
    errors.push("Message cannot be empty");
  }

  if (text.length > 5000) {
    errors.push("Message exceeds maximum length (5000 characters)");
  }

  // Sanitize text - prevent XSS
  const sanitized = sanitizeText(text);

  return {
    valid: errors.length === 0,
    errors,
    text: sanitized.trim(),
  };
}

/**
 * Validates receiver ID
 */
function validateReceiverId(receiverId) {
  const errors = [];

  if (!receiverId) {
    errors.push("Receiver ID is required");
    return { valid: false, errors };
  }

  const id = normalizeId(receiverId);
  if (!id) {
    errors.push("Invalid receiver ID format");
  }

  // Check if valid MongoDB ObjectId
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    errors.push("Receiver ID must be a valid user ID");
  }

  return {
    valid: errors.length === 0,
    errors,
    receiverId: id,
  };
}

/**
 * Validates ticket message
 */
function validateTicketMessage(data) {
  const errors = [];

  if (!data) {
    errors.push("Ticket message data is required");
    return { valid: false, errors };
  }

  // Validate message text
  const messageValidation = validateMessage(data);
  if (!messageValidation.valid) {
    errors.push(...messageValidation.errors);
  }

  // Validate receiver
  const receiverValidation = validateReceiverId(data.receiverId);
  if (!receiverValidation.valid) {
    errors.push(...receiverValidation.errors);
  }

  // Validate ticket ID
  if (!data.ticketId || !mongoose.Types.ObjectId.isValid(data.ticketId)) {
    errors.push("Invalid ticket ID");
  }

  return {
    valid: errors.length === 0,
    errors,
    text: messageValidation.text,
    receiverId: receiverValidation.receiverId,
    ticketId: data.ticketId,
  };
}

/**
 * Sanitizes text to prevent XSS
 */
function sanitizeText(text) {
  if (typeof text !== "string") return "";

  return text
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Normalizes user ID to string
 */
function normalizeId(value) {
  if (value === null || value === undefined) return "";
  return value.toString();
}

/**
 * Validates conversation exists between users
 */
async function validateConversationExists(userId, otherUserId, Conversation) {
  try {
    if (!Conversation) return true; // Skip if no model provided

    const convo = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    return !!convo;
  } catch (err) {
    console.error("[Validation] Conversation check error:", err.message);
    return true; // Allow if check fails
  }
}

/**
 * Check for duplicate messages (deduplication)
 */
async function isDuplicateMessage(senderId, receiverId, text, Message, timeWindow = 1000) {
  try {
    if (!Message) return false;

    const recentMessage = await Message.findOne({
      sender: senderId,
      receiver: receiverId,
      text,
      createdAt: { $gte: new Date(Date.now() - timeWindow) },
    });

    return !!recentMessage;
  } catch (err) {
    console.error("[Validation] Duplicate check error:", err.message);
    return false;
  }
}

module.exports = {
  validateMessage,
  validateReceiverId,
  validateTicketMessage,
  sanitizeText,
  normalizeId,
  validateConversationExists,
  isDuplicateMessage,
};
