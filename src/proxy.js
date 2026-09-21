import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";
import { STUDIO_SESSION_COOKIE } from "@/lib/studio-auth";

const handler = createMiddleware(routing);

const LOCALES = ["en", "it"];

function isStudioRoute(pathname) {
  return LOCALES.some(
    (l) =>
      pathname === `/${l}/studio` || pathname.startsWith(`/${l}/studio/`)
  );
}

function isStudioLoginRoute(pathname) {
  return LOCALES.some(
    (l) =>
      pathname === `/${l}/studio/login` ||
      pathname.startsWith(`/${l}/studio/login/`)
  );
}

function isLegacyArchiveRoute(pathname) {
  return LOCALES.some(
    (l) =>
      pathname === `/${l}/archive` || pathname.startsWith(`/${l}/archive/`)
  );
}

function localeFromPath(pathname) {
  return pathname.startsWith("/it/") || pathname === "/it" ? "it" : "en";
}

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const locale = localeFromPath(pathname);

  // Legacy /archive bookmarks → /studio
  if (isLegacyArchiveRoute(pathname)) {
    const rest = pathname.replace(new RegExp(`^/${locale}/archive`), "");
    if (rest === "/login" || rest.startsWith("/login/")) {
      return NextResponse.redirect(new URL(`/${locale}/studio/login`, request.url));
    }
    return NextResponse.redirect(
      new URL(`/${locale}/studio/archive${rest === "/" ? "" : rest}`, request.url)
    );
  }

  if (isStudioRoute(pathname) && !isStudioLoginRoute(pathname)) {
    const session = request.cookies.get(STUDIO_SESSION_COOKIE);
    const secret = process.env.ARCHIVE_SESSION_SECRET;

    if (!secret || !session || session.value !== secret) {
      return NextResponse.redirect(
        new URL(`/${locale}/studio/login`, request.url)
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
