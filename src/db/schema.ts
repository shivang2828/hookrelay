// HookRelay database schema: the "register book" of our courier company.
// drizzle-kit reads this file and generates SQL migrations from it (npm run db:generate).
//
// Table relationships:
//   apps ─┬─< api_keys
//         ├─< endpoints ─────────────┐
//         └─< messages ─< deliveries >┘ ─< delivery_attempts
// (─< means "one to many": one app has many endpoints, one message has many deliveries, ...)
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// Reusable column helpers so every table uses the same conventions
// - uuid ids: unguessable and safe to expose in URLs (unlike 1, 2, 3... which leak how many rows exist)
// - timestamptz ("with time zone"): stores an absolute moment, so servers in different
//   time zones always agree on when a retry is due
const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ─────────────────────────────────────────────────────────────
// apps: one row per company (tenant) using HookRelay
// ─────────────────────────────────────────────────────────────
export const apps = pgTable("apps", {
  id: id(),
  name: text("name").notNull(),
  createdAt: createdAt(),
  // Soft delete (Shivang's design call): "deleting" an app sets this timestamp instead of
  // erasing rows, so delivery history survives for audits and debugging.
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ─────────────────────────────────────────────────────────────
// api_keys: how a company authenticates to our API
// ─────────────────────────────────────────────────────────────
export const apiKeys = pgTable(
  "api_keys",
  {
    id: id(),
    // Foreign key: every key belongs to an app. "cascade" means a HARD delete of the app
    // removes its keys too (only used for deliberate cleanup; normally we soft delete).
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    // We store a HASH of the key, never the key itself (Day 3), exactly like passwords.
    // UNIQUE: two keys can never hash to the same stored value.
    keyHash: text("key_hash").notNull().unique(),
    // First few characters (e.g. "hr_live_ab12") so users can tell their keys apart in a UI
    prefix: text("prefix").notNull(),
    createdAt: createdAt(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  // The 2nd argument returns table-level extras: indexes, composite uniques, checks.
  // Postgres does NOT index foreign keys automatically, so we add one for "keys of this app".
  (t) => [index("api_keys_app_id_idx").on(t.appId)],
);

// ─────────────────────────────────────────────────────────────
// endpoints: a customer URL that receives webhooks
// ─────────────────────────────────────────────────────────────
export const endpoints = pgTable(
  "endpoints",
  {
    id: id(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    // Shared secret used to sign every payload with HMAC (Day 6)
    secret: text("secret").notNull(),
    // Which event types this endpoint wants, e.g. {order.paid, order.refunded}.
    // A Postgres array column; '{}' is an empty array.
    eventTypes: text("event_types")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: text("status").notNull().default("active"),
    // Circuit breaker counter (Day 10): after too many failures in a row, auto-disable
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index("endpoints_app_id_idx").on(t.appId),
    // CHECK constraint: the database itself rejects any status other than these two,
    // the same protection the "active" | "disabled" union gives us in TypeScript.
    check("endpoints_status_check", sql`${t.status} in ('active', 'disabled')`),
  ],
);

// ─────────────────────────────────────────────────────────────
// messages: one event a company sent us
// ─────────────────────────────────────────────────────────────
export const messages = pgTable(
  "messages",
  {
    id: id(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    // The customer's data, shape unknown: Postgres's version of TypeScript's `unknown`.
    // jsonb = stored as validated, queryable binary JSON.
    payload: jsonb("payload").notNull(),
    // From the optional Idempotency-Key header (Day 4). Nullable: not every request sends one.
    idempotencyKey: text("idempotency_key"),
    createdAt: createdAt(),
  },
  (t) => [
    // THE most important line of Day 2. If two identical requests arrive at the same instant,
    // both "check then insert" in code would pass; this UNIQUE makes Postgres accept only one.
    // NULLs are treated as distinct, so many messages WITHOUT a key never clash.
    unique("messages_app_idempotency_key").on(t.appId, t.idempotencyKey),
    // "Show this app's latest messages": filter by app_id, then sort by created_at
    index("messages_app_created_idx").on(t.appId, t.createdAt),
  ],
);

// ─────────────────────────────────────────────────────────────
// deliveries: one message going to ONE endpoint (retried independently)
// ─────────────────────────────────────────────────────────────
export const deliveries = pgTable(
  "deliveries",
  {
    id: id(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    endpointId: uuid("endpoint_id")
      .notNull()
      .references(() => endpoints.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    // When the next retry is due; null = nothing scheduled (delivered or given up)
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One delivery per (message, endpoint): a message can never be queued twice for the same URL
    unique("deliveries_message_endpoint").on(t.messageId, t.endpointId),
    check(
      "deliveries_status_check",
      sql`${t.status} in ('pending', 'queued', 'delivered', 'failed')`,
    ),
    // PARTIAL index: only contains PENDING rows. The dispatcher (Day 5) asks every second
    // "which pending deliveries are due now?". Delivered/failed rows (the vast majority over
    // time) never enter this index, so it stays tiny and fast.
    index("deliveries_due_idx")
      .on(t.nextAttemptAt)
      .where(sql`${t.status} = 'pending'`),
  ],
);

// ─────────────────────────────────────────────────────────────
// delivery_attempts: one row per HTTP attempt (the debugging history)
// ─────────────────────────────────────────────────────────────
export const deliveryAttempts = pgTable(
  "delivery_attempts",
  {
    id: id(),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => deliveries.id, { onDelete: "cascade" }),
    // All nullable: a timeout has no status code, a success has no error, etc.
    // (Matches the AttemptResult discriminated union in src/domain/types.ts.)
    statusCode: integer("status_code"),
    latencyMs: integer("latency_ms"),
    responseSnippet: text("response_snippet"), // first part of the response body, for debugging
    error: text("error"),
    createdAt: createdAt(),
  },
  // "Show the attempt history of this delivery, oldest first"
  (t) => [index("delivery_attempts_delivery_created_idx").on(t.deliveryId, t.createdAt)],
);
