import { HomeCtaLink } from "@/components/home/HomeCtaLink";

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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <ul className="grid flex-1 grid-cols-3 gap-3">{children}</ul>
      <HomeCtaLink href={href} className="self-end sm:self-auto">
        {label} →
      </HomeCtaLink>
    </div>
  );
}
