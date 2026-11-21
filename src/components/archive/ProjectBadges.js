"use client";

/** "A, B" for a list field (always an array from the API), "—" when empty. */
export function listText(values) {
  return (values ?? []).join(", ") || "—";
}

/** Notes icon and "not paid" badge shown next to a project's title. */
export function ProjectBadges({ project }) {
  return (
    <>
      {project.notes?.trim() && (
        <span title={project.notes.trim()} className="ml-1.5 inline-flex align-text-bottom">
          <svg
            className="h-3.5 w-3.5 text-amber-500/80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-label="Has notes"
          >
            <path d="M15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9z" />
            <path d="M15 3v6h6" />
            <path d="M8 13h8M8 17h5" />
          </svg>
        </span>
      )}
      {project.paid === false && (
        <span
          className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-2xs font-bold leading-none text-white"
          title="Not paid"
          aria-label="Not paid"
        >
          $
        </span>
      )}
    </>
  );
}
