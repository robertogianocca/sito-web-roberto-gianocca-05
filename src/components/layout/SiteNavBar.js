import { getTranslations } from "next-intl/server";
import { FiHome } from "react-icons/fi";
import { LanguageSwitcher } from "@/components/home/LanguageSwitcher.client";
import { Link } from "@/i18n/navigation";

/**
 * Narrow top bar (slate-400 + grain). Horizontal inset matches HorizontalSection / PageShell (px-6 md:px-10).
 */
export async function SiteNavBar() {
  const t = await getTranslations("Nav");

  return (
    <nav
      aria-label="Site"
      className="site-nav site-chrome-grain pointer-events-auto fixed top-0 left-0 z-30 h-(--site-nav-height) w-full overflow-hidden bg-slate-400 md:z-10"
    >
      <div className="site-nav-inner">
        <Link
          href="/"
          aria-label={t("homeLabel")}
          className="absolute inset-y-0 left-0 z-2 flex w-12 items-center justify-center text-zinc-800 transition-colors hover:text-white focus-visible:rounded-md focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-zinc-900 md:static md:h-full md:w-9"
        >
          <FiHome aria-hidden="true" className="size-5" />
        </Link>
        <LanguageSwitcher />
      </div>
    </nav>
  );
}
