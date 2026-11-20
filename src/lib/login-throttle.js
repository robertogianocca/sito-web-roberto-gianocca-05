import { createHash } from "node:crypto";
import { getTursoClient } from "./turso";

/**
 * Limits failed studio logins per client: after MAX_FAILURES wrong passwords
 * within WINDOW_MS (counted from the first failure), further attempts are
 * refused until the window ends. A successful login clears the counter.
 *
 * Clients are identified by a hash of their IP (salted with the session
 * secret), so no IP address is stored in the database.
 */
export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;

/** Stable, non-reversible key for a client IP. */
export function loginThrottleKey(ip) {
  return createHash("sha256")
    .update(`${process.env.ARCHIVE_SESSION_SECRET || ""}:${ip || "unknown"}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Client IP from the request headers. On Vercel `x-real-ip` and
 * `x-forwarded-for` are set by the platform, not by the client.
 */
export function clientIpFromHeaders(headers) {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

/** `{ allowed: true }` or `{ allowed: false, retryAfterSeconds }`. */
export async function checkLoginAllowed(key, now = Date.now()) {
  const db = getTursoClient();
  const { rows } = await db.execute({
    sql: "SELECT failures, windowStart FROM login_attempts WHERE key = ?",
    args: [key],
  });
  const row = rows[0];
  if (!row) return { allowed: true };

  const windowEnd = new Date(row.windowStart).getTime() + WINDOW_MS;
  if (Number(row.failures) >= MAX_FAILURES && windowEnd > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((windowEnd - now) / 1000),
    };
  }
  return { allowed: true };
}

/** Counts a failed attempt; starts a new window if the last one ended. */
export async function recordLoginFailure(key, now = Date.now()) {
  const db = getTursoClient();
  const nowIso = new Date(now).toISOString();
  const windowCutoff = new Date(now - WINDOW_MS).toISOString();
  await db.batch(
    [
      {
        // SET expressions all see the row as it was before the update.
        sql: `INSERT INTO login_attempts (key, failures, windowStart)
          VALUES (?1, 1, ?2)
          ON CONFLICT(key) DO UPDATE SET
            failures = CASE WHEN windowStart <= ?3 THEN 1 ELSE failures + 1 END,
            windowStart = CASE WHEN windowStart <= ?3 THEN ?2 ELSE windowStart END`,
        args: [key, nowIso, windowCutoff],
      },
      {
        sql: "DELETE FROM login_attempts WHERE windowStart < ?",
        args: [new Date(now - RETENTION_MS).toISOString()],
      },
    ],
    "write"
  );
}

export async function clearLoginFailures(key) {
  const db = getTursoClient();
  await db.execute({
    sql: "DELETE FROM login_attempts WHERE key = ?",
    args: [key],
  });
}
