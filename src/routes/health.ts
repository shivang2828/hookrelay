import { Router } from "express";

// A Router is a mini-app holding a group of routes; app.ts plugs it in with app.use().
export const healthRouter = Router();

// GET /health → 200 { "status": "ok", "uptimeSeconds": <number> }
// Load balancers, Docker and uptime monitors call this to check the app is alive.
healthRouter.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()), // seconds since the process started
  });
});
