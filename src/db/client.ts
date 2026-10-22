// Database connection, created ONCE and shared by the whole app.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config.js";
import * as schema from "./schema.js";

// A Pool keeps several open connections and reuses them. Opening a new connection per
// query is slow (TCP + TLS + auth handshake every time), so every real backend uses a pool.
// `max` caps how many connections we hold. Postgres has a hard limit, and every app
// instance (API, workers) shares it, so we keep each pool modest.
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

// Passing the schema gives fully typed queries, e.g. db.query.messages.findMany(...):
// TypeScript knows every column and its type, straight from schema.ts.
export const db = drizzle(pool, { schema });
