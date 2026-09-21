import { NextResponse } from "next/server";

/**
 * Shared studio auth (Archive + Time).
 * Cookie name kept for Vercel env compatibility; Bearer support can be added later.
 */
export const STUDIO_SESSION_COOKIE = "archive_session";

export function isStudioAuthenticated(request) {
  const session = request.cookies.get(STUDIO_SESSION_COOKIE);
  const secret = process.env.ARCHIVE_SESSION_SECRET;
  return Boolean(secret && session?.value === secret);
}

export function unauthorizedJson() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
