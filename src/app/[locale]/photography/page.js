import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { PHOTOGRAPHY_GALLERIES } from "@/data/photography-galleries";
import { CloudinaryProbePanel } from "@/components/photography/CloudinaryProbePanel";
import { GalleryGrid, GalleryGridSkeleton } from "@/components/photography/GalleryGrid";
import { BackLink } from "@/components/shared/BackLink";
import { PageShell } from "@/components/shared/PageShell";
import { TagFilter } from "@/components/shared/TagFilter";
import {
  fetchCloudinaryResourceProbe,
  isCloudinaryConfigured,
} from "@/lib/cloudinary-server";

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

  const probe = SHOW_CLOUDINARY_PROBE
    ? await fetchCloudinaryResourceProbe(CLOUDINARY_PROBE_PUBLIC_ID)
    : null;

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
          <Suspense fallback={<GalleryGridSkeleton count={filtered.length || 6} />}>
            <GalleryGrid filtered={filtered} locale={locale} activeTag={activeTag} />
          </Suspense>
        </div>
      </div>
    </PageShell>
  );
}
