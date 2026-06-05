import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { VIDEOS } from "@/data/videos";
import { VideoCard } from "@/components/video/VideoCard";
import { BackLink } from "@/components/shared/BackLink";
import { PageShell } from "@/components/shared/PageShell";
import { TagFilter } from "@/components/shared/TagFilter";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Video" });
  return {
    title: `Video | Roberto Gianocca`,
    description: t("metaDescription"),
    alternates: buildAlternates("/video", routing),
  };
}

function collectAllTags(videos) {
  const set = new Set();
  for (const v of videos) {
    for (const tag of v.tags ?? []) {
      set.add(tag);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export default async function VideoPage({ params, searchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Video");

  const { tag } = await searchParams;
  const activeTag = typeof tag === "string" && tag.length > 0 ? tag : null;

  const allTags = collectAllTags(VIDEOS);

  const filtered =
    activeTag !== null
      ? VIDEOS.filter((v) => (v.tags ?? []).includes(activeTag))
      : VIDEOS;

  function getTitle(video) {
    return typeof video.title === "object"
      ? (video.title[locale] ?? video.title.en)
      : video.title;
  }

  function getDescription(video) {
    return typeof video.shortDescription === "object"
      ? (video.shortDescription[locale] ?? video.shortDescription.en)
      : video.shortDescription;
  }

  return (
    <PageShell
      header={
        <div className="space-y-2">
          <BackLink href="/" label={t("backLabel")} />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Video
          </h1>
          <p className="max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
            {t("pageDescription")}
          </p>
          <TagFilter basePath="/video" tags={allTags} activeTag={activeTag} allLabel={t("allLabel")} />
        </div>
      }
    >
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300/80 bg-background p-8 text-zinc-600 dark:border-zinc-700/80 dark:text-zinc-400">
          <p className="font-medium text-foreground">
            {activeTag ? t("noVideoWithTag", { tag: activeTag }) : t("noVideos")}
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            {activeTag ? (
              <>
                {t("tryOtherTag")}{" "}
                <a
                  href={`/${locale}/video`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {t("showAllVideos")}
                </a>
                .
              </>
            ) : (
              t("addVideos")
            )}
          </p>
        </div>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2">
          {filtered.map((video) => (
            <li key={video.slug}>
              <VideoCard
                title={getTitle(video)}
                shortDescription={getDescription(video)}
                thumbnailUrl={video.thumbnailUrl}
                thumbnailAlt={t("thumbnailAlt", { title: getTitle(video) })}
                href={`/video/${video.slug}`}
              />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
