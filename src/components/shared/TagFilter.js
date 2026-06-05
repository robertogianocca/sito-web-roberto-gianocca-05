import { Link } from "@/i18n/navigation";

/**
 * Barra di filtro per tag. Ogni bottone è un `<Link>` che aggiorna il query param `tag`.
 * Passare `tags=[]` o non passarlo se non ci sono tag definiti — il componente non renderizza nulla.
 *
 * @param {{
 *   basePath: string;
 *   tags: string[];
 *   activeTag: string | null;
 *   allLabel?: string;
 * }} props
 */
export function TagFilter({ basePath, tags, activeTag, allLabel = "All" }) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <TagPill
        href={basePath}
        label={allLabel}
        active={!activeTag}
      />
      {tags.map((tag) => (
        <TagPill
          key={tag}
          href={`${basePath}?tag=${encodeURIComponent(tag)}`}
          label={tag}
          active={activeTag === tag}
        />
      ))}
    </div>
  );
}

/**
 * @param {{ href: string; label: string; active: boolean }} props
 */
function TagPill({ href, label, active }) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
