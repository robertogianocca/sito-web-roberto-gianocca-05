import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const linkClassName =
  "inline-flex items-center gap-2 text-lg font-medium text-foreground underline-offset-4 transition-colors hover:text-zinc-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:hover:text-zinc-200";

export function HomeIntroNav() {
  const t = useTranslations("Nav");

  return (
    <nav aria-label={t("label")} className="mt-8">
      <ul className="flex flex-col gap-3">
        <li>
          <Link href="/photography" className={linkClassName}>Photography</Link>
        </li>
        <li>
          <Link href="/video" className={linkClassName}>Video</Link>
        </li>
        <li>
          {/* Hash link: scrolls to section on the home page, no locale prefix needed */}
          <a href="#graphic-design" className={linkClassName}>Graphic design</a>
        </li>
        <li>
          <Link href="/blog" className={linkClassName}>Blog</Link>
        </li>
        <li>
          <a href="#contact" className={linkClassName}>{t("contact")}</a>
        </li>
      </ul>
    </nav>
  );
}
