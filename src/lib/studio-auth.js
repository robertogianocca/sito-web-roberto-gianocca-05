import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Studio auth (Archive + Time), shared by the proxy, the studio layout, the
 * login action and every studio API route.
 *
 * The session cookie holds a signed token: `<payload>.<signature>`, where the
 * payload is base64url JSON `{ v, iat, exp }` and the signature is
 * HMAC-SHA256 of the payload with ARCHIVE_SESSION_SECRET. A token is valid
 * only while `exp` is in the future, so a copied cookie stops working when it
 * expires. Changing ARCHIVE_SESSION_SECRET invalidates every session at once.
 *
 * Cookie name kept for compatibility with existing deployments; Bearer
 * support (Mac/mobile app) can be added in `readRequestToken`.
 */
export const STUDIO_SESSION_COOKIE = "archive_session";

/** Session lifetime, also used as the cookie's maxAge. */
export const STUDIO_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const TOKEN_VERSION = 1;
const encoder = new TextEncoder();
const keyCache = new Map();

function sessionSecret() {
  return process.env.ARCHIVE_SESSION_SECRET || "";
}

async function hmacKey(secret) {
  let key = keyCache.get(secret);
  if (!key) {
    key = crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    keyCache.set(secret, key);
  }
  return key;
}

/** Signs a new session token. Throws if the secret is not configured. */
export async function createSessionToken({ now = Date.now() } = {}) {
  const secret = sessionSecret();
  if (!secret) throw new Error("ARCHIVE_SESSION_SECRET is not set.");
  const iat = Math.floor(now / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      v: TOKEN_VERSION,
      iat,
      exp: iat + STUDIO_SESSION_MAX_AGE_SECONDS,
    })
  ).toString("base64url");
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    encoder.encode(payload)
  );
  return `${payload}.${Buffer.from(signature).toString("base64url")}`;
}

/**
 * Returns the session payload if `token` is correctly signed and not
 * expired, else null. Never throws.
 */
export async function verifySessionToken(token, { now = Date.now() } = {}) {
  const secret = sessionSecret();
  if (!secret || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [payload, signature] = parts;

  try {
    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      Buffer.from(signature, "base64url"),
      encoder.encode(payload)
    );
    if (!valid) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data?.v !== TOKEN_VERSION || typeof data.exp !== "number") return null;
    if (data.exp * 1000 <= now) return null;
    return data;
  } catch {
    return null;
  }
}

/** Cookie options for the session cookie. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: STUDIO_SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}

/** Compares the submitted password with ARCHIVE_PASSWORD in constant time. */
export function studioPasswordMatches(password) {
  const expected = process.env.ARCHIVE_PASSWORD;
  if (!expected) return false;
  // Hash both sides so the comparison has a fixed length.
  const a = createHash("sha256").update(String(password ?? "")).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function readRequestToken(request) {
  return request.cookies.get(STUDIO_SESSION_COOKIE)?.value;
}

/** For the proxy and route handlers: is this request signed in? */
export async function isStudioAuthenticated(request) {
  return Boolean(await verifySessionToken(readRequestToken(request)));
}

/**
 * For server components and server actions (uses `cookies()`): the session
 * payload, or null when not signed in.
 */
export async function getStudioSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(STUDIO_SESSION_COOKIE)?.value);
}

export function unauthorizedJson() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Wraps a route handler so it runs only for a signed-in request:
 * `export const GET = withStudioAuth(async (request, context) => { … })`.
 *
 * Errors with a 4xx `status` (InputError, NotFoundError, TimerConflictError,
 * see lib/studio/errors.js) are answered with their message; anything else
 * is logged and answered with a generic 500, so internal details never reach
 * the browser.
 */
export function withStudioAuth(handler) {
  return async function studioAuthHandler(request, context) {
    if (!(await isStudioAuthenticated(request))) return unauthorizedJson();
    try {
      return await handler(request, context);
    } catch (err) {
      const status = Number(err?.status);
      if (status >= 400 && status < 500) {
        const body = { error: err.message };
        if (err.issues?.length) body.issues = err.issues;
        return NextResponse.json(body, { status });
      }
      console.error(`Studio API error: ${request.method} ${request.url}`, err);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
  };
}
