// HookRelay domain types: TypeScript descriptions of the "things" in the system.
// Every other file imports these, so they're the vocabulary of the whole project.
// (These types only exist at compile time; data from outside is validated with Zod on Day 3.)

// A union of string literals: a typo like "deliverd" becomes a compile error.
// Lifecycle: pending → queued → delivered, or → failed after the last retry.
export type DeliveryStatus = "pending" | "queued" | "delivered" | "failed";

// A customer URL that receives webhooks
export type Endpoint = {
  id: string;
  appId: string; // which company (tenant) owns this endpoint
  url: string;
  secret: string; // used to sign payloads with HMAC (Day 6)
  eventTypes: string[]; // which events it subscribes to, e.g. ["order.paid"]
  status: "active" | "disabled"; // disabled endpoints get no deliveries (circuit breaker, Day 10)
  createdAt: Date;
};

// One event a company sent to HookRelay
export type Message = {
  id: string;
  appId: string;
  eventType: string;
  // `unknown`, not `any`: it's the customer's data and we never trust its shape.
  // Code must check it before using it; `any` would switch type checking off.
  payload: unknown;
  // From the optional Idempotency-Key header (Day 4). `null` forces callers to handle "no key".
  idempotencyKey: string | null;
  createdAt: Date;
};

// One message being delivered to ONE endpoint.
// A message subscribed by 3 endpoints creates 3 deliveries, each retried independently.
export type Delivery = {
  id: string;
  messageId: string;
  endpointId: string;
  status: DeliveryStatus; // reuses the type above, so new statuses are added in one place
  attemptCount: number;
  nextAttemptAt: Date | null; // when to retry; null = nothing scheduled
};

// The result of ONE HTTP delivery attempt: a "discriminated union".
// The `ok` field tells TypeScript which shape it is, so after `if (result.ok)`
// you can only read the fields that actually exist on that branch.
export type AttemptResult =
  | { ok: true; statusCode: number; latencyMs: number }
  // statusCode is optional on failure: a 500 response has one, a timeout doesn't
  | { ok: false; error: string; statusCode?: number };

// A generic type: one definition for every paginated list (Page<Message>, Page<Endpoint>, ...)
export type Page<T> = {
  items: T[];
  nextCursor: string | null; // null = no more pages (cursor pagination, Day 8)
};
