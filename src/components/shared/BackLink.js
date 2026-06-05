import { Link } from "@/i18n/navigation";

/**
 * Consistent back-navigation link used across all inner pages.
 *
 * @param {{ href: string; label: string }} props
 */
export function BackLink({ href, label }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-foreground hover:underline dark:text-zinc-400"
    >
      ← {label}
    </Link>
  );
}
