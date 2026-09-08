"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const destinationLocale = locale === "it" ? "en" : "it";

  function switchLocale(nextLocale) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <>
      <Link
        href={pathname}
        locale={destinationLocale}
        replace
        aria-label={
          destinationLocale === "en"
            ? t("switchToEnglish")
            : t("switchToItalian")
        }
        className="mobile-lang-switch"
      >
        <span className={locale === "it" ? "is-active" : undefined}>IT</span>
        <span className={locale === "en" ? "is-active" : undefined}>EN</span>
      </Link>

      <div
        role="group"
        aria-label={t("languageSwitcherLabel")}
        className="hidden gap-0.5 md:flex"
      >
        {routing.locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => switchLocale(l)}
            aria-current={l === locale ? "true" : undefined}
            className={[
              "rounded-full px-2 py-0.5 text-xs font-medium tracking-wide transition-colors",
              l === locale
                ? "bg-zinc-900 text-white"
                : "bg-slate-500/40 text-zinc-800 hover:bg-slate-500/60",
            ].join(" ")}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </>
  );
}
