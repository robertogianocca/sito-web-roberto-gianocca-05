import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";

const handler = createMiddleware(routing);

const LOCALES = ["en", "it"];

function isArchiveRoute(pathname) {
  return LOCALES.some(
    (l) =>
      pathname === `/${l}/archive` ||
      pathname.startsWith(`/${l}/archive/`)
  );
}

function isLoginRoute(pathname) {
  return LOCALES.some(
    (l) =>
      pathname === `/${l}/archive/login` ||
      pathname.startsWith(`/${l}/archive/login/`)
  );
}

function localeFromPath(pathname) {
  return pathname.startsWith("/it/") || pathname === "/it" ? "it" : "en";
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (isArchiveRoute(pathname) && !isLoginRoute(pathname)) {
    const session = request.cookies.get("archive_session");
    const secret = process.env.ARCHIVE_SESSION_SECRET;

    if (!secret || !session || session.value !== secret) {
      const locale = localeFromPath(pathname);
      return NextResponse.redirect(
        new URL(`/${locale}/archive/login`, request.url)
      );
    }
  }

  return handler(request);
}

export const config = {
  matcher: [
    // Match all pathnames except Next.js internals, API routes, and static assets.
    "/((?!_next|_vercel|api|.*\\..*).*)",
  ],
};
