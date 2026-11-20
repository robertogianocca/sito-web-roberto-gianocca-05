import { createClient } from "@libsql/client";
import { runMigrations } from "./studio/migrations";

let client = null;

export function getTursoClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error(
        "TURSO_DATABASE_URL is not set. Add it to .env.local and Vercel environment variables."
      );
    }

    client = createClient({ url, authToken });
  }
  return client;
}

let initPromise = null;

/**
 * Makes sure the schema is up to date (see ./studio/migrations.js).
 * Runs once per server instance; concurrent callers share the same run, and
 * a failed run is retried by the next caller.
 */
export function ensureInit() {
  if (!initPromise) {
    initPromise = runMigrations(getTursoClient()).catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}
