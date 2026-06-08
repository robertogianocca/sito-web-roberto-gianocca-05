import { getTranslations } from "next-intl/server";
import { PhotographyGalleryCard } from "./PhotographyGalleryCard";
import { fetchFolderGallery, isCloudinaryConfigured } from "@/lib/cloudinary-server";

async function resolveGalleryCover(gallery) {
  try {
    if (!isCloudinaryConfigured()) {
      return { coverSrc: null, footnote: "cloudinary_not_configured" };
    }
    const payload = await fetchFolderGallery(gallery.folder);
    if (!payload.ok) {
      if (payload.reason === "empty_folder") {
        return { coverSrc: null, footnote: "empty_folder" };
      }
      return { coverSrc: null, footnote: "load_error" };
    }
    return { coverSrc: payload.coverSrc, footnote: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { coverSrc: null, footnote: `error:${message}` };
  }
}

/**
 * Async server component that fetches Cloudinary covers and renders the
 * gallery grid. Intended to be wrapped in a <Suspense> boundary so the
 * page shell can render immediately while this resolves.
 *
 * @param {{
 *   filtered: import("@/data/photography-galleries").PhotographyGallery[];
 *   locale: string;
 *   activeTag: string | null;
 * }} props
 */
export async function GalleryGrid({ filtered, locale, activeTag }) {
  const t = await getTranslations("Photography");

  function resolveFootnote(footnote) {
    if (!footnote) return null;
    if (footnote === "cloudinary_not_configured") return t("cloudinaryNotConfigured");
    if (footnote === "empty_folder") return t("emptyFolder");
    if (footnote === "load_error") return t("loadError");
    if (footnote.startsWith("error:")) return `${t("cloudinaryError")} ${footnote.slice(6)}`;
    return footnote;
  }

  const entries = await Promise.all(
    filtered.map(async (gallery) => {
      const { coverSrc, footnote } = await resolveGalleryCover(gallery);
      return { gallery, coverSrc, footnote };
    }),
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300/80 bg-background p-8 text-zinc-600 dark:border-zinc-700/80 dark:text-zinc-400">
        <p className="font-medium text-foreground">
          {activeTag ? t("noGalleryWithTag", { tag: activeTag }) : t("noGalleries")}
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          {activeTag ? (
            <>
              {t("tryOtherTag")}{" "}
              <a
                href={`/${locale}/photography`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {t("showAllGalleries")}
              </a>
              .
            </>
          ) : (
            t("addGalleries")
          )}
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-8 md:grid-cols-3">
      {entries.map(({ gallery, coverSrc, footnote }, i) => {
        const title =
          typeof gallery.title === "object"
            ? (gallery.title[locale] ?? gallery.title.en)
            : gallery.title;
        const shortDescription =
          typeof gallery.shortDescription === "object"
            ? (gallery.shortDescription[locale] ?? gallery.shortDescription.en)
            : gallery.shortDescription;
        return (
          <li key={gallery.slug}>
            <PhotographyGalleryCard
              title={title}
              shortDescription={shortDescription}
              coverSrc={coverSrc}
              coverAlt={t("coverAlt", { title })}
              footnote={resolveFootnote(footnote)}
              href={`/photography/${gallery.slug}`}
              coverPreload={i === 0 && Boolean(coverSrc)}
            />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Placeholder grid shown while GalleryGrid is resolving.
 * Mirrors the card structure with animated pulse blocks.
 *
 * @param {{ count?: number }} props
 */
export function GalleryGridSkeleton({ count = 6 }) {
  return (
    <ul className="grid gap-8 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div className="flex h-full flex-col overflow-hidden rounded-sm border border-zinc-200/90 bg-background shadow-sm dark:border-zinc-800/90">
            <div className="px-5 pt-5">
              <div className="aspect-4/3 w-full animate-pulse rounded-sm bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <div className="flex flex-col gap-2 px-5 pb-5 pt-4">
              <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-3 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
