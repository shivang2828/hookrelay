// // HookRelay domain types
// // Fill in every ____ with the right type, then run: npm run typecheck
// // Delete each TODO comment once that blank is done.

// export type DeliveryStatus = "pending" | "queued" | "delivered" | "failed";

// // A customer URL that receives webhooks
// export type Endpoint = {
//   id: string;
//   appId: string;
//   url: ____;
//   secret: ____;
//   eventTypes: ____; // TODO: an ARRAY of strings
//   status: ____; // TODO: a union of two string values, "active" or "disabled"
//   createdAt: ____; // TODO: not a string, a real date object
// };

// // One event a company sent to HookRelay
// export type Message = {
//   id: string;
//   appId: string;
//   eventType: ____;
//   payload: ____; // TODO: we don't know its shape. Which is safer: any or unknown?
//   idempotencyKey: ____; // TODO: a string OR null (the header is optional)
//   createdAt: ____;
// };

// // One message being delivered to one endpoint
// export type Delivery = {
//   id: string;
//   messageId: string;
//   endpointId: string;
//   status: ____; // TODO: reuse a type defined at the top of this file
//   attemptCount: ____;
//   nextAttemptAt: ____; // TODO: a Date OR null (null = nothing scheduled)
// };

// // The result of ONE HTTP attempt to deliver. A discriminated union:
// // the `ok` field tells TypeScript which shape it is.
// export type AttemptResult =
//   | { ok: true; statusCode: ____; latencyMs: ____ }
//   | { ok: false; error: ____; statusCode____ }; // TODO: OPTIONAL number (a timeout has no status code). Hint: name?: type

// // Bonus: one generic type for every paginated list (Page<Message>, Page<Endpoint>, ...)
// export type Page<T> = {
//   items: ____; // TODO: an array of T
//   nextCursor: ____; // TODO: string or null
// };


export type DeliveryStatus = "pending" | "queued" | "delivered" | "failed";

// A customer URL that receives webhooks
export type Endpoint = {
  id: string;
  appId: string;
  url: string;
  secret: string;
  eventTypes: string[];
  status: "active" | "disabled";
  createdAt: Date;
};

// One event a company sent to HookRelay
export type Message = {
  id: string;
  appId: string;
  eventType: string;
  payload: unknown;
  idempotencyKey: string | null;
  createdAt: Date;
};

// One message being delivered to one endpoint
export type Delivery = {
  id: string;
  messageId: string;
  endpointId: string;
  status: DeliveryStatus;
  attemptCount: number;
  nextAttemptAt: Date | null;
};

// The result of ONE HTTP attempt to deliver
export type AttemptResult =
  | { ok: true; statusCode: number; latencyMs: number }
  | { ok: false; error: string; statusCode?: number };

// Generic type for every paginated list
export type Page<T> = {
  items: T[];
  nextCursor: string | null;
};