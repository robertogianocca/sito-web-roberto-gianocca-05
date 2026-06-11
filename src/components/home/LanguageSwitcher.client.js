"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div role="group" aria-label={t("languageSwitcherLabel")} className="flex gap-0.5">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
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
  );
}
