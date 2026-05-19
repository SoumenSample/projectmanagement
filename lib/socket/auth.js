const { getToken } = require("next-auth/jwt");

/**
 * Socket authentication middleware
 * Validates JWT token from socket handshake
 */
async function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      return next(new Error("Authentication required: No token provided"));
    }

    // Verify token with NextAuth secret
    const decoded = await getToken({
      req: { headers: { cookie: socket.handshake.headers.cookie } },
      secret: process.env.NEXTAUTH_SECRET,
      token: socket.handshake.auth.token,
    });

    // Fallback: validate token format if NextAuth verification fails
    if (!decoded && socket.handshake.auth.userId) {
      // Simple validation - in production, use proper JWT verification
      try {
        const jwt = require("jsonwebtoken");
        const verified = jwt.verify(token, process.env.NEXTAUTH_SECRET);
        socket.userId = verified.sub || verified.id || socket.handshake.auth.userId;
      } catch (err) {
        return next(new Error("Authentication failed: Invalid token"));
      }
    } else if (decoded) {
      socket.userId = decoded.sub || decoded.id;
    } else {
      return next(new Error("Authentication failed: Invalid credentials"));
    }

    next();
  } catch (err) {
    console.error("[Socket Auth] Error:", err.message);
    next(new Error(`Authentication error: ${err.message}`));
  }
}

/**
 * Middleware to attach userId from token to socket
 */
function attachUserIdMiddleware(socket, next) {
  const userId = socket.handshake.auth?.userId;
  if (userId) {
    socket.userId = userId;
  }
  next();
}

module.exports = {
  socketAuthMiddleware,
  attachUserIdMiddleware,
};
