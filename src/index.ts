// Entry point: the ONLY file that starts the server.
// Importing config first means a missing env var stops the app right here, before anything starts.
import { config } from "./config.js";
import { createApp } from "./app.js";
import { pool } from "./db/client.js";

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`HookRelay listening on port ${config.port}`);
});

// Graceful shutdown: when Docker/AWS stops the app it sends SIGTERM (Ctrl+C sends SIGINT).
// server.close() stops accepting NEW requests but lets in-flight requests finish,
// so no client gets cut off mid-response. (We'll extend this on Day 10 for queue workers.)
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  // 1) stop taking new HTTP requests and let in-flight ones finish,
  // 2) then close the database pool so Postgres connections are released cleanly
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
