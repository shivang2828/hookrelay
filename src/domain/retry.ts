// // Retry schedule for failed webhook deliveries.
// // Fill in every ____ and the TODO steps, then delete the TODO comments.

// const SECOND = 1000;
// const MINUTE = ____ * SECOND; // TODO: how many seconds in a minute?
// const HOUR = ____ * MINUTE;

// // Delay before the NEXT attempt, indexed by how many attempts have failed so far.
// // Index 0 = wait after the 1st failure, index 1 = after the 2nd, ...
// const RETRY_DELAYS_MS = [
//   5 * SECOND,
//   ____, // TODO: 30 seconds
//   ____, // TODO: 2 minutes
//   ____, // TODO: 10 minutes
//   ____, // TODO: 30 minutes
//   ____, // TODO: 1 hour
//   ____, // TODO: 3 hours
// ];

// /**
//  * How long to wait before retrying, after `attempt` failed attempts.
//  * Returns null when we should give up (the delivery becomes "failed" / dead-lettered).
//  */
// export function retryDelayMs(attempt: number): number | null {
//   // TODO step 1: guard against bad input. If attempt is less than 1, what should we return?

//   // TODO step 2: read the delay from RETRY_DELAYS_MS.
//   //   attempt 1 should give index 0. What index does attempt N map to?
//   //   Hover over your variable in VS Code: its type is `number | undefined`
//   //   because of noUncheckedIndexedAccess in tsconfig.json.

//   // TODO step 3: if the value is undefined (attempt 8 or more), return null.
//   //   Otherwise return the delay.
// }




const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

// Delay before the NEXT attempt, indexed by how many attempts have failed so far.
const RETRY_DELAYS_MS = [
  5 * SECOND,
  30 * SECOND,
  2 * MINUTE,
  10 * MINUTE,
  30 * MINUTE,
  1 * HOUR,
  3 * HOUR,
];

/**
 * How long to wait before retrying, after `attempt` failed attempts.
 * Returns null when we should give up.
 */
export function retryDelayMs(attempt: number): number | null {
  if (attempt < 1) {
    return null;
  }

  const delay = RETRY_DELAYS_MS[attempt - 1];

  if (delay === undefined) {
    return null;
  }

  return delay;
}
