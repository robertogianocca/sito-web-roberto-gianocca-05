import { GalleryGridSkeleton } from "@/components/photography/GalleryGrid";

/**
 * Shown by Next.js while the photography listing page async component
 * is resolving (e.g. translations, searchParams). In practice this renders
 * very briefly; the inner Suspense boundary in page.js handles the longer
 * Cloudinary loading phase with the same skeleton.
 */
export default function PhotographyLoading() {
  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      {/* Header skeleton */}
      <header className="border-b border-zinc-200/80 bg-background/80 px-6 py-6 backdrop-blur dark:border-zinc-800/80 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="space-y-3">
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-9 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-4 w-96 max-w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="flex gap-2">
              <div className="h-7 w-14 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-7 w-20 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-7 w-16 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </header>

      {/* Gallery grid skeleton */}
      <main className="mx-auto max-w-6xl px-6 py-10 md:px-0 md:py-12">
        <GalleryGridSkeleton count={6} />
      </main>
    </div>
  );
}
