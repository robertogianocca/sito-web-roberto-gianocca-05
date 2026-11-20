import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { setupTempDatabase } from "../helpers/db.js";
import { ensureInit, getTursoClient } from "@/lib/turso";
import {
  createSessionToken,
  isStudioAuthenticated,
  studioPasswordMatches,
  verifySessionToken,
  withStudioAuth,
} from "@/lib/studio-auth";
import {
  MAX_FAILURES,
  WINDOW_MS,
  checkLoginAllowed,
  clearLoginFailures,
  clientIpFromHeaders,
  loginThrottleKey,
  recordLoginFailure,
} from "@/lib/login-throttle";

setupTempDatabase();

const SECRET = "test-secret-0123456789abcdef0123456789abcdef";
const DAY = 864e5;

// Set before any key or token is computed (the throttle key is salted with it).
process.env.ARCHIVE_SESSION_SECRET = SECRET;
process.env.ARCHIVE_PASSWORD = "correct horse";

beforeAll(() => ensureInit());

beforeEach(() => {
  process.env.ARCHIVE_SESSION_SECRET = SECRET;
});

function requestWithCookie(value) {
  return {
    cookies: { get: () => (value === undefined ? undefined : { value }) },
  };
}

describe("session token", () => {
  it("accepts a token it signed", async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toMatchObject({ v: 1 });
  });

  it("rejects the old cookie format (the raw secret)", async () => {
    expect(await verifySessionToken(SECRET)).toBeNull();
  });

  it("rejects a token whose payload was changed", async () => {
    const [, signature] = (await createSessionToken()).split(".");
    const forged = Buffer.from(JSON.stringify({ v: 1, iat: 0, exp: 9999999999 })).toString(
      "base64url"
    );
    expect(await verifySessionToken(`${forged}.${signature}`)).toBeNull();
  });

  it("rejects malformed tokens", async () => {
    for (const token of ["", "a.b.c", "nodot", ".", undefined, null, 42]) {
      expect(await verifySessionToken(token)).toBeNull();
    }
  });

  it("expires after 30 days", async () => {
    const now = Date.now();
    const token = await createSessionToken({ now });
    expect(await verifySessionToken(token, { now: now + 29 * DAY })).not.toBeNull();
    expect(await verifySessionToken(token, { now: now + 30 * DAY + 1000 })).toBeNull();
  });

  it("stops working when the secret changes", async () => {
    const token = await createSessionToken();
    process.env.ARCHIVE_SESSION_SECRET = "another-secret";
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("rejects everything when no secret is configured", async () => {
    const token = await createSessionToken();
    process.env.ARCHIVE_SESSION_SECRET = "";
    expect(await verifySessionToken(token)).toBeNull();
  });
});

describe("password", () => {
  it("matches only the configured password", () => {
    expect(studioPasswordMatches("correct horse")).toBe(true);
    expect(studioPasswordMatches("correct horse ")).toBe(false);
    expect(studioPasswordMatches("")).toBe(false);
    expect(studioPasswordMatches(undefined)).toBe(false);
  });
});

describe("withStudioAuth", () => {
  const handler = withStudioAuth(async () => Response.json({ ok: true }));

  it("answers 401 without a valid session", async () => {
    expect((await handler(requestWithCookie(undefined))).status).toBe(401);
    expect((await handler(requestWithCookie(SECRET))).status).toBe(401);
  });

  it("runs the handler with a valid session", async () => {
    const response = await handler(requestWithCookie(await createSessionToken()));
    expect(response.status).toBe(200);
    expect(await isStudioAuthenticated(requestWithCookie(await createSessionToken()))).toBe(
      true
    );
  });
});

describe("login throttle", () => {
  const t0 = Date.parse("2026-11-20T10:00:00Z");
  const key = loginThrottleKey("203.0.113.7");

  beforeEach(() =>
    getTursoClient().execute("DELETE FROM login_attempts")
  );

  async function fail(times, start = t0) {
    for (let i = 0; i < times; i++) await recordLoginFailure(key, start + i * 1000);
  }

  it("does not store the IP itself", () => {
    expect(key).not.toContain("203.0.113.7");
    expect(loginThrottleKey("203.0.113.7")).toBe(key);
    expect(loginThrottleKey("198.51.100.2")).not.toBe(key);
  });

  it(`blocks after ${MAX_FAILURES} failures within the window`, async () => {
    await fail(MAX_FAILURES - 1);
    expect((await checkLoginAllowed(key, t0 + 10_000)).allowed).toBe(true);
    await fail(1, t0 + 10_000);
    const gate = await checkLoginAllowed(key, t0 + 11_000);
    expect(gate.allowed).toBe(false);
    expect(gate.retryAfterSeconds).toBe(WINDOW_MS / 1000 - 11);
  });

  it("does not block other clients", async () => {
    await fail(MAX_FAILURES);
    const other = loginThrottleKey("198.51.100.2");
    expect((await checkLoginAllowed(other, t0 + 10_000)).allowed).toBe(true);
  });

  it("allows again when the window has passed, and starts a new count", async () => {
    await fail(MAX_FAILURES);
    expect((await checkLoginAllowed(key, t0 + WINDOW_MS + 1000)).allowed).toBe(true);
    await recordLoginFailure(key, t0 + WINDOW_MS + 2000);
    const { rows } = await getTursoClient().execute({
      sql: "SELECT failures FROM login_attempts WHERE key = ?",
      args: [key],
    });
    expect(Number(rows[0].failures)).toBe(1);
  });

  it("clears the count after a successful login", async () => {
    await fail(MAX_FAILURES);
    await clearLoginFailures(key);
    expect((await checkLoginAllowed(key, t0 + 10_000)).allowed).toBe(true);
  });

  it("reads the client IP set by the platform", () => {
    expect(
      clientIpFromHeaders(new Headers({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))
    ).toBe("1.2.3.4");
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe(
      "5.6.7.8"
    );
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});
