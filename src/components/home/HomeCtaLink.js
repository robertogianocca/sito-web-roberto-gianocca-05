import { Link } from "@/i18n/navigation";

function ArrowRightIcon({ className }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 12H19M19 12L13 6M19 12L13 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Solid CTA used for home “browse more” / “see project” links.
 *
 * @param {{
 *   href: string;
 *   children: import('react').ReactNode;
 *   className?: string;
 *   showArrow?: boolean;
 * }} props
 */
export function HomeCtaLink({ href, children, className = "", showArrow = false }) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:focus-visible:outline-zinc-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      {showArrow ? <ArrowRightIcon className="size-3.5 shrink-0" /> : null}
    </Link>
  );
}
