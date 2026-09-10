import { Link } from "@/i18n/navigation";

/**
 * Solid CTA used for home “browse more” / “see project” links.
 *
 * @param {{
 *   href: string;
 *   children: import('react').ReactNode;
 *   className?: string;
 * }} props
 */
export function HomeCtaLink({ href, children, className = "" }) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:focus-visible:outline-zinc-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Link>
  );
}
