"use client";

import { usePathname } from "@/i18n/navigation";

/**
 * Global footer shell (slate-400 + grain). Per-route content via @footer parallel route.
 * Hidden on photography and archive routes. In-flow on mobile; fixed bottom bar from md up.
 *
 * Soft navigation can leave a stale @footer slot (Next.js keeps the last matching
 * parallel-route state). Only mount slot children on `/video/[slug]` so the
 * filmstrip does not linger on home or other pages.
 */
export function SiteFooter({ children }) {
  const pathname = usePathname();
  const hide =
    pathname === "/photography" ||
    pathname.startsWith("/photography/") ||
    pathname === "/archive" ||
    pathname.startsWith("/archive/") ||
    pathname === "/studio" ||
    pathname.startsWith("/studio/");

  if (hide) {
    return null;
  }

  const isVideoDetail = /^\/video\/[^/]+$/.test(pathname);

  return (
    <footer className="site-chrome-grain pointer-events-none relative z-10 h-(--site-footer-height) w-full shrink-0 overflow-hidden bg-slate-400 px-6 pt-3 md:fixed md:bottom-0 md:left-0 md:px-10">
      <div className="relative z-1 pointer-events-auto">
        {isVideoDetail ? children : null}
      </div>
    </footer>
  );
}
