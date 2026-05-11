/**
 * Boilerplate media blocks on a 12-column grid (desktop).
 * Squares stand in for images or video thumbnails.
 */
export function PlaceholderGrid({ variant = "mixed" }) {
  if (variant === "hero") {
    return (
      <div className="grid grid-cols-12 gap-3 md:gap-4">
        <MediaPlaceholder
          className="col-span-12 aspect-video md:col-span-8"
          label="Video 16:9"
        />
        <div className="col-span-12 grid grid-cols-2 gap-3 md:col-span-4 md:grid-cols-1 md:gap-4">
          <MediaPlaceholder className="aspect-square" label="1:1" />
          <MediaPlaceholder className="aspect-square" label="1:1" />
        </div>
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div className="grid grid-cols-12 gap-3 md:gap-4">
        <MediaPlaceholder className="col-span-12 aspect-video sm:col-span-6 md:col-span-4" />
        <MediaPlaceholder className="col-span-12 aspect-video sm:col-span-6 md:col-span-4" />
        <MediaPlaceholder className="col-span-12 aspect-video sm:col-span-12 md:col-span-4" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-3 md:gap-4">
      <MediaPlaceholder className="col-span-12 aspect-4/3 md:col-span-7" label="4:3" />
      <div className="col-span-12 grid grid-cols-2 gap-3 md:col-span-5 md:grid-cols-1 md:gap-4">
        <MediaPlaceholder className="aspect-square" />
        <MediaPlaceholder className="aspect-square" />
      </div>
    </div>
  );
}

function MediaPlaceholder({ className = "", label = "Media" }) {
  return (
    <div
      className={`flex min-h-0 min-w-0 items-end justify-end rounded-lg border border-dashed border-zinc-400/60 bg-zinc-200/80 p-2 text-xs font-medium text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400 ${className}`}
    >
      <span className="rounded bg-zinc-100/90 px-1.5 py-0.5 dark:bg-zinc-900/90">
        {label}
      </span>
    </div>
  );
}
