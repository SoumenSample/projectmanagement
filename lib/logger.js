// Centralized logger with basic redaction for sensitive fields
const SENSITIVE_KEY_RE = /(password|pass|token|secret|apikey|api_key|key|ssn|card|ccnum|cardnumber|email|phone|contact)/i;
const EMAIL_RE = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const PHONE_RE = /(?:\+?\d[\d\s-]{6,}\d)/g;

function maskEmail(s) {
  return s.replace(EMAIL_RE, (_, user, domain) => {
    const visible = user.length > 2 ? user.slice(0, 1) + "***" + user.slice(-1) : "***";
    return `${visible}@${domain}`;
  });
}

function maskPhone(s) {
  return s.replace(PHONE_RE, (m) => {
    const digits = m.replace(/\D/g, "");
    if (digits.length <= 4) return "***";
    return "***" + digits.slice(-4);
  });
}

function sanitizeValue(val) {
  if (val == null) return val;
  if (typeof val === "string") {
    let v = val;
    v = v.replace(/(sk_live|sk_test|pk_live|pk_test)[^\s]*/gi, "[REDACTED]");
    v = v.replace(/(api[_-]?key|secret[_-]?key)[^\s]*/gi, "[REDACTED]");
    v = maskEmail(v);
    v = maskPhone(v);
    return v;
  }
  if (typeof val === "number" || typeof val === "boolean") return val;
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (typeof val === "object") return sanitizeObject(val);
  return String(val);
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    try {
      if (SENSITIVE_KEY_RE.test(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = sanitizeValue(obj[k]);
      }
    } catch (e) {
      out[k] = "[UNSANITIZABLE]";
    }
  }
  return out;
}

function formatArgs(args) {
  return args.map((a) => {
    try {
      if (typeof a === "string") return sanitizeValue(a);
      if (typeof a === "object") return sanitizeValue(a);
      return a;
    } catch (e) {
      return "[LOG_ERROR]";
    }
  });
}

const logger = {
  info: (...args) => {
    const out = formatArgs(args);
    try { console.log(...out); } catch (e) { /* ignore */ }
  },
  warn: (...args) => {
    const out = formatArgs(args);
    try { console.warn(...out); } catch (e) { /* ignore */ }
  },
  error: (...args) => {
    const out = formatArgs(args);
    try { console.error(...out); } catch (e) { /* ignore */ }
  },
  sanitize: (v) => sanitizeValue(v),
};

module.exports = logger;
