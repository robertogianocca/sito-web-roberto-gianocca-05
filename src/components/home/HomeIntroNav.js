import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const linkClassName =
  "inline-flex items-center gap-2 text-lg font-medium text-foreground underline-offset-4 transition-colors hover:text-zinc-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:hover:text-zinc-200";

export function HomeIntroNav() {
  const tNav = useTranslations("Nav");
  const tHome = useTranslations("Home");

  // Areas with their own route use the locale-aware Link. Graphic design and contact
  // only exist as panels on this page, so they stay plain hash anchors.
  const items = [
    { id: "photography", label: tHome("photographyTitle"), href: "/photography" },
    { id: "video", label: tHome("videoTitle"), href: "/video" },
    { id: "graphic-design", label: tHome("graphicDesignTitle") },
    { id: "blog", label: tHome("blogTitle"), href: "/blog" },
    { id: "contact", label: tHome("contactTitle") },
  ];

  return (
    <nav aria-label={tNav("label")} className="mt-8">
      <ul className="flex flex-col gap-3">
        {items.map(({ id, label, href }) => (
          <li key={id}>
            {href ? (
              <Link href={href} className={linkClassName}>
                {label}
              </Link>
            ) : (
              <a href={`#${id}`} className={linkClassName}>
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
