/**
 * Socket error and event logger
 * Logs to console and optionally to file/external service in production
 */
class SocketLogger {
  constructor(options = {}) {
    this.isDev = process.env.NODE_ENV !== "production";
    this.logFile = options.logFile || null;
    this.enableFileLogging = options.enableFileLogging || false;
  }

  /**
   * Log authentication events
   */
  logAuth(level, userId, event, details = {}) {
    const timestamp = new Date().toISOString();
    const log = {
      timestamp,
      category: "AUTH",
      level,
      userId,
      event,
      details,
    };

    this._output(log);
  }

  /**
   * Log message events
   */
  logMessage(level, userId, event, details = {}) {
    const timestamp = new Date().toISOString();
    const log = {
      timestamp,
      category: "MESSAGE",
      level,
      userId,
      event,
      details,
    };

    this._output(log);
  }

  /**
   * Log connection events
   */
  logConnection(level, socketId, event, details = {}) {
    const timestamp = new Date().toISOString();
    const log = {
      timestamp,
      category: "CONNECTION",
      level,
      socketId,
      event,
      details,
    };

    this._output(log);
  }

  /**
   * Log errors
   */
  logError(category, error, context = {}) {
    const timestamp = new Date().toISOString();
    const log = {
      timestamp,
      category: `ERROR:${category}`,
      level: "error",
      error: {
        message: error?.message || String(error),
        stack: this.isDev ? error?.stack : undefined,
        code: error?.code,
      },
      context,
    };

    this._output(log);
    
    // In production, also send to external service (optional)
    if (!this.isDev && process.env.ERROR_LOG_SERVICE) {
      this._sendToExternalService(log).catch(() => {});
    }
  }

  /**
   * Log validation errors
   */
  logValidationError(userId, event, errors, data = {}) {
    const timestamp = new Date().toISOString();
    const log = {
      timestamp,
      category: "VALIDATION",
      level: "warn",
      userId,
      event,
      errors,
      dataKeys: Object.keys(data),
    };

    this._output(log);
  }

  /**
   * Log rate limit violations
   */
  logRateLimit(userId, event, remaining, resetAt) {
    const timestamp = new Date().toISOString();
    const log = {
      timestamp,
      category: "RATE_LIMIT",
      level: "warn",
      userId,
      event,
      remaining,
      resetAt,
    };

    this._output(log);
  }

  /**
   * Log emission attempts
   */
  logEmit(targetUserIds, eventName, success, details = {}) {
    const timestamp = new Date().toISOString();
    const log = {
      timestamp,
      category: "EMIT",
      level: success ? "info" : "warn",
      targetCount: targetUserIds?.length || 0,
      eventName,
      success,
      details,
    };

    this._output(log);
  }

  /**
   * Internal output handler
   */
  _output(log) {
    if (this.isDev) {
      // Development: colorized console output
      const prefix = `[${log.category}] [${log.level.toUpperCase()}]`;
      const message = `${prefix} ${JSON.stringify(log)}`;

      switch (log.level) {
        case "error":
          console.error(message);
          break;
        case "warn":
          console.warn(message);
          break;
        case "info":
          console.log(message);
          break;
        default:
          console.debug(message);
      }
    } else {
      // Production: JSON output to stdout
      console.log(JSON.stringify(log));
    }

    // Write to file if enabled
    if (this.enableFileLogging) {
      this._writeToFile(log);
    }
  }

  /**
   * Write log to file (optional)
   */
  _writeToFile(log) {
    if (!this.logFile) return;

    const fs = require("fs").promises;
    const line = JSON.stringify(log) + "\n";

    fs.appendFile(this.logFile, line).catch((err) => {
      console.error("[Logger] Failed to write to file:", err.message);
    });
  }

  /**
   * Send to external service (optional)
   */
  async _sendToExternalService(log) {
    const service = process.env.ERROR_LOG_SERVICE;
    if (!service) return;

    try {
      await fetch(service, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
        timeout: 5000,
      });
    } catch (err) {
      console.error("[Logger] Failed to send to external service:", err.message);
    }
  }
}

// Export singleton
let logger = null;

function getLogger(options = {}) {
  if (!logger) {
    logger = new SocketLogger(options);
  }
  return logger;
}

module.exports = {
  SocketLogger,
  getLogger,
};
