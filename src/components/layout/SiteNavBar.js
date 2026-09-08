import { LanguageSwitcher } from "@/components/home/LanguageSwitcher.client";

/**
 * Narrow top bar (slate-400 + grain). Horizontal inset matches HorizontalSection / PageShell (px-6 md:px-10).
 */
export function SiteNavBar() {
  return (
    <nav
      aria-label="Site"
      className="site-nav site-chrome-grain pointer-events-auto fixed top-0 left-0 z-30 h-(--site-nav-height) w-full overflow-hidden bg-slate-400 md:z-10"
    >
      <div className="site-nav-inner">
        <LanguageSwitcher />
      </div>
    </nav>
  );
}
