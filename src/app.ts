import express, { type NextFunction, type Request, type Response } from "express";
import { healthRouter } from "./routes/health.js";

// Builds the Express app but does NOT start listening (index.ts does that).
// Why split? On Day 9, tests import createApp() and send fake requests to it
// without opening a real network port.
export function createApp() {
  const app = express();

  // Parse JSON request bodies into req.body (limit protects us from huge payloads)
  app.use(express.json({ limit: "1mb" }));

  // ---- Routes ----
  app.use(healthRouter);

  // ---- 404 handler ----
  // Express runs middleware in order. If a request reaches this point,
  // no route above matched it, so it's "not found".
  // We return JSON (not Express's default HTML page) because we're an API.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "not_found" });
  });

  // ---- Error handler ----
  // Express recognises an error handler by its FOUR parameters (err, req, res, next).
  // It must be registered LAST. In Express 5, an error thrown inside an async route
  // is sent here automatically (Express 4 needed try/catch everywhere).
  //
  // `err` is `unknown`, not `any`: anything can be thrown in JavaScript, so we don't
  // assume it's an Error object.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // Client mistakes (e.g. malformed JSON body) are 4xx, not 500. express.json() throws an
    // error carrying `status: 400`. 4xx = "your fault", 5xx = "our fault", and monitoring
    // alerts on 5xx, so mislabelling client errors as 500 would page us for nothing.
    if (isClientError(err)) {
      res.status(err.status).json({ error: "bad_request" });
      return;
    }

    // Log the full error on the SERVER so we can debug it...
    console.error("Unhandled error:", err);

    // ...but send only a generic message to the CLIENT. Error messages and stack traces
    // can leak file paths, library versions, SQL queries or secrets that help attackers.
    res.status(500).json({ error: "internal_error" });
  });

  return app;
}

// A "type guard": a function whose return type `err is ...` tells TypeScript that, when it
// returns true, `err` has a numeric `status` field. This is how we safely inspect an `unknown`.
function isClientError(err: unknown): err is { status: number } {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof err.status === "number" &&
    err.status >= 400 &&
    err.status < 500
  );
}
