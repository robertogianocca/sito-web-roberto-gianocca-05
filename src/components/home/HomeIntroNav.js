import Link from "next/link";

const INTRO_NAV_LINKS = [
  { label: "Photography", href: "/photography" },
  { label: "Video", href: "/video" },
  { label: "Graphic design", href: "#graphic-design" },
  { label: "Contatti", href: "#contact" },
];

const linkClassName =
  "inline-flex items-center gap-2 text-lg font-medium text-foreground underline-offset-4 transition-colors hover:text-zinc-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:hover:text-zinc-200";

export function HomeIntroNav() {
  return (
    <nav aria-label="Aree del portfolio" className="mt-8">
      <ul className="flex flex-col gap-3">
        {INTRO_NAV_LINKS.map(({ label, href }) => (
          <li key={href}>
            <Link href={href} className={linkClassName}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
