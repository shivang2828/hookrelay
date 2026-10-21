// Retry schedule for failed webhook deliveries.
//
// The waits grow quickly (5s → 3h). This is "exponential-style backoff": if a customer's
// server is down, hammering it every second makes things worse. Spacing retries out gives it
// time to recover. On Day 6 we add "jitter" (a little randomness) so thousands of retries
// don't all fire at the exact same moment.

const SECOND = 1000; // milliseconds
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

// Delay before the NEXT attempt, indexed by how many attempts have failed so far.
// Index 0 = wait after the 1st failure, index 1 = after the 2nd, ...
// An array instead of 7 if-statements: changing the schedule means editing one list.
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
 * Returns null when we should give up (the delivery becomes "failed", i.e. dead-lettered).
 */
export function retryDelayMs(attempt: number): number | null {
  // Guard against bad input: 0, negative or fractional attempts make no sense
  if (!Number.isInteger(attempt) || attempt < 1) {
    return null;
  }

  // Because of "noUncheckedIndexedAccess" in tsconfig.json, this is `number | undefined`:
  // TypeScript reminds us the index might be past the end of the array.
  const delay = RETRY_DELAYS_MS[attempt - 1];

  // Past the end of the schedule (attempt 8+) means "give up"
  if (delay === undefined) {
    return null;
  }

  // TypeScript now knows `delay` is a plain number (narrowing)
  return delay;
}
