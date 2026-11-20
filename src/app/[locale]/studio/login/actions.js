"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { ensureInit } from "@/lib/turso";
import {
  STUDIO_SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  studioPasswordMatches,
} from "@/lib/studio-auth";
import {
  checkLoginAllowed,
  clearLoginFailures,
  clientIpFromHeaders,
  loginThrottleKey,
  recordLoginFailure,
} from "@/lib/login-throttle";

export async function loginAction(prevState, formData) {
  const password = String(formData.get("password") ?? "");
  // Only known locales: the value ends up in the redirect URL.
  const rawLocale = String(formData.get("locale") ?? "");
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;

  if (!process.env.ARCHIVE_PASSWORD || !process.env.ARCHIVE_SESSION_SECRET) {
    return {
      error:
        "Studio not configured. Add ARCHIVE_PASSWORD and ARCHIVE_SESSION_SECRET to .env.local.",
    };
  }

  await ensureInit();
  const throttleKey = loginThrottleKey(clientIpFromHeaders(await headers()));

  const gate = await checkLoginAllowed(throttleKey);
  if (!gate.allowed) {
    const minutes = Math.ceil(gate.retryAfterSeconds / 60);
    return {
      error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  if (!studioPasswordMatches(password)) {
    await recordLoginFailure(throttleKey);
    return { error: "Invalid password." };
  }

  await clearLoginFailures(throttleKey);
  const cookieStore = await cookies();
  cookieStore.set(
    STUDIO_SESSION_COOKIE,
    await createSessionToken(),
    sessionCookieOptions()
  );

  redirect(`/${locale}/studio/archive`);
}
