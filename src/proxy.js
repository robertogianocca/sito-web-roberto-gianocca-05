import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handler = createMiddleware(routing);

export function proxy(request) {
  return handler(request);
}

export const config = {
  matcher: [
    // Match all pathnames except Next.js internals and static assets.
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
