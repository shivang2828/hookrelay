// Reads environment variables ONCE, when the app starts.
//
// Why "fail fast"? If DATABASE_URL is missing, we want the app to refuse to start
// with a clear message, instead of starting "fine" and crashing later on the first
// real request (at 2 AM, in production). Problems found at startup are cheap to fix.
//
// Env vars are loaded from .env by Node itself (see the --env-file flag in package.json),
// so we don't need the dotenv package.

function requireEnv(name: string): string {
  // process.env values are typed `string | undefined`: TypeScript forces us to handle "missing"
  const value = process.env[name];

  // `!value` catches both undefined (not set) and "" (set but empty)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  // After the check above TypeScript knows `value` is a string (this is "narrowing")
  return value;
}

function requirePort(name: string): number {
  const port = Number(requireEnv(name));
  // Number("abc") gives NaN, so check it's a real, valid port number
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Environment variable ${name} must be a valid port number`);
  }
  return port;
}

// One typed object the rest of the app imports. Nobody else touches process.env directly,
// so all config lives in one place and every value is already validated.
export const config = {
  port: requirePort("PORT"),
  databaseUrl: requireEnv("DATABASE_URL"),
  redisUrl: requireEnv("REDIS_URL"),
};
