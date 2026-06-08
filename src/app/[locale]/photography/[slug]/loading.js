/**
 * Shown while the gallery detail page async component is resolving.
 * Mirrors the two-panel layout of GallerySlideshow (sidebar + dark main panel)
 * so there is no layout shift when the real content appears.
 */
export default function GalleryLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col md:overflow-hidden">
      {/* ===== Mobile skeleton ===== */}
      <div className="flex min-h-0 flex-1 flex-col bg-zinc-50 md:hidden dark:bg-zinc-950">
        <div className="border-b border-zinc-200/80 bg-background p-4 dark:border-zinc-800/80">
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-3 space-y-2">
            <div className="h-5 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center bg-zinc-900">
          <Spinner />
        </div>
      </div>

      {/* ===== Desktop skeleton ===== */}
      <div className="hidden min-h-0 flex-1 md:flex md:flex-row md:overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        {/* Sidebar */}
        <aside className="flex w-full shrink-0 flex-col gap-4 border-r border-zinc-200/80 bg-background p-4 md:h-full md:w-[min(100%,15rem)] dark:border-zinc-800/80 lg:w-64 lg:p-5">
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="mt-2 space-y-3 border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80">
            <div className="h-3 w-10 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="flex gap-2">
              <div className="h-10 flex-1 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-10 flex-1 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-sm bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        </aside>

        {/* Main image panel */}
        <main className="flex min-w-0 flex-1 items-center justify-center bg-zinc-900">
          <Spinner />
        </main>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div
      className="h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white"
      aria-hidden
    />
  );
}
