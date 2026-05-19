const { createServer } = require("http");
const next = require("next");
const { initSocket } = require("./lib/socket/server.js");
const logger = require("./lib/logger");

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const isDev = process.env.NODE_ENV !== "production";

const app = next({ dev: isDev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(handler);
  const io = initSocket(server);

  server.listen(port, host, () => {
    logger.info(`Server running on http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    io.close(() => {
      server.close(() => {
        process.exit(0);
      });
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
});