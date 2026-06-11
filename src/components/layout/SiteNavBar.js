import { LanguageSwitcher } from "@/components/home/LanguageSwitcher.client";

/**
 * Narrow top bar (slate-400 + grain). Horizontal inset matches HorizontalSection / PageShell (px-6 md:px-10).
 */
export function SiteNavBar() {
  return (
    <nav
      aria-label="Site"
      className="site-chrome-grain fixed top-0 left-0 z-10 flex h-(--site-nav-height) w-full items-center justify-start overflow-hidden bg-slate-400 px-6 md:px-10"
    >
      <div className="relative z-1">
        <LanguageSwitcher />
      </div>
    </nav>
  );
}
