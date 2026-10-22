// Config for drizzle-kit, the CLI that turns src/db/schema.ts into SQL migration files
// (npm run db:generate) and applies them to the database (npm run db:migrate).
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside our app, so it doesn't get the --env-file flag from `npm run dev`.
// Node 22 can load .env itself: this fills process.env from the .env file, if it exists.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env file (e.g. in CI or production): use the real environment variables instead
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set (check your .env file)");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts", // where our tables are defined (Step 3)
  out: "./drizzle", // generated SQL migration files go here, and get committed
  dbCredentials: { url: databaseUrl },
  strict: true, // ask for confirmation before risky changes like dropping a column
});
