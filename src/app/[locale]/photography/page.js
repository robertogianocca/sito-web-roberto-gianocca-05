import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { PHOTOGRAPHY_GALLERIES } from "@/data/photography-galleries";
import { CloudinaryProbePanel } from "@/components/photography/CloudinaryProbePanel";
import { PhotographyGalleryCard } from "@/components/photography/PhotographyGalleryCard";
import { BackLink } from "@/components/shared/BackLink";
import { PageShell } from "@/components/shared/PageShell";
import { TagFilter } from "@/components/shared/TagFilter";
import {
  fetchCloudinaryResourceProbe,
  fetchFolderGallery,
  isCloudinaryConfigured,
} from "@/lib/cloudinary-server";
import { plainTextFromMarkdown } from "@/lib/plain-text-from-markdown";

const SHOW_CLOUDINARY_PROBE = process.env.PHOTOGRAPHY_ENABLE_PROBE === "1";
const CLOUDINARY_PROBE_PUBLIC_ID = process.env.PHOTOGRAPHY_PROBE_PUBLIC_ID ?? "02_olvllg";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Photography" });
  return {
    title: `Photography | Roberto Gianocca`,
    description: t("metaDescription"),
    alternates: buildAlternates("/photography", routing),
  };
}

function collectAllTags(galleries) {
  const set = new Set();
  for (const g of galleries) {
    for (const tag of g.tags ?? []) {
      set.add(tag);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

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

export default async function PhotographyPage({ params, searchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Photography");

  const { tag } = await searchParams;
  const activeTag = typeof tag === "string" && tag.length > 0 ? tag : null;

  const allTags = collectAllTags(PHOTOGRAPHY_GALLERIES);

  const filtered =
    activeTag !== null
      ? PHOTOGRAPHY_GALLERIES.filter((g) => (g.tags ?? []).includes(activeTag))
      : PHOTOGRAPHY_GALLERIES;

  const entries = await Promise.all(
    filtered.map(async (gallery) => {
      const { coverSrc, footnote } = await resolveGalleryCover(gallery);
      return { gallery, coverSrc, footnote };
    }),
  );

  const probe = SHOW_CLOUDINARY_PROBE
    ? await fetchCloudinaryResourceProbe(CLOUDINARY_PROBE_PUBLIC_ID)
    : null;

  function resolveFootnote(footnote) {
    if (!footnote) return null;
    if (footnote === "cloudinary_not_configured") return t("cloudinaryNotConfigured");
    if (footnote === "empty_folder") return t("emptyFolder");
    if (footnote === "load_error") return t("loadError");
    if (footnote.startsWith("error:")) return `${t("cloudinaryError")} ${footnote.slice(6)}`;
    return footnote;
  }

  return (
    <PageShell
      header={
        <div className="space-y-2">
          <BackLink href="/" label={t("backLabel")} />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Photography
          </h1>
          <p className="max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
            {t("pageDescription")}{" "}
            <a
              href={`/${locale}/photography/revalidate-cache`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("regenerateCache")}
            </a>
            .
          </p>
          <TagFilter basePath="/photography" tags={allTags} activeTag={activeTag} allLabel={t("allLabel")} />
        </div>
      }
    >
      <div className={probe ? "flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12" : ""}>
        <CloudinaryProbePanel probe={probe} />

        <div className="min-w-0 flex-1">
          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300/80 bg-background p-8 text-zinc-600 dark:border-zinc-700/80 dark:text-zinc-400">
              <p className="font-medium text-foreground">
                {activeTag
                  ? t("noGalleryWithTag", { tag: activeTag })
                  : t("noGalleries")}
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
          ) : (
            <ul className="grid gap-8 md:grid-cols-3">
              {entries.map(({ gallery, coverSrc, footnote }, i) => (
                <li key={gallery.slug}>
                  <PhotographyGalleryCard
                    title={typeof gallery.title === "object" ? gallery.title[locale] ?? gallery.title.en : gallery.title}
                    shortDescription={typeof gallery.shortDescription === "object" ? gallery.shortDescription[locale] ?? gallery.shortDescription.en : gallery.shortDescription}
                    coverSrc={coverSrc}
                    coverAlt={t("coverAlt", { title: typeof gallery.title === "object" ? gallery.title[locale] ?? gallery.title.en : gallery.title })}
                    footnote={resolveFootnote(footnote)}
                    href={`/photography/${gallery.slug}`}
                    coverPreload={i === 0 && Boolean(coverSrc)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}
