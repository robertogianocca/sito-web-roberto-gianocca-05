import { Link } from "@/i18n/navigation";

/**
 * Row of section thumbnails followed by a "see all" link.
 * Shared by the Photography and Video panels so both keep the same rhythm.
 * The link drops below the grid on small screens, where sitting beside it
 * squeezed the three thumbnails to about 70px each.
 *
 * @param {{
 *   href: string;
 *   label: string;
 *   children: import('react').ReactNode;
 * }} props
 */
export function HomeThumbRow({ href, label, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <ul className="grid flex-1 grid-cols-3 gap-3">{children}</ul>
      <Link
        href={href}
        className="shrink-0 self-end text-xs font-medium text-zinc-500 underline-offset-2 hover:text-foreground hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        {label} →
      </Link>
    </div>
  );
}
