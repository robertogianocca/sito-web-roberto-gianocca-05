import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { VIDEOS } from "@/data/videos";
import { VideoCard } from "@/components/video/VideoCard";
import { VideoCardRow } from "@/components/video/VideoCardRow.client";
import { BackLink } from "@/components/shared/BackLink";
import { TagFilter } from "@/components/shared/TagFilter";
import { resolveLocalized } from "@/lib/i18n-content";
import { plainTextFromMarkdown } from "@/lib/plain-text-from-markdown";

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

  function getSubtitle(video) {
    return plainTextFromMarkdown(resolveLocalized(video.subtitle, locale));
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="shrink-0 border-b border-zinc-200/80 bg-background/80 px-6 py-6 backdrop-blur dark:border-zinc-800/80 md:px-10">
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
      </header>

      {filtered.length === 0 ? (
        <main
          aria-label={t("projectsAriaLabel")}
          className="mx-6 my-8 rounded-xl border border-dashed border-zinc-300/80 bg-background p-8 text-zinc-600 md:mx-10 dark:border-zinc-700/80 dark:text-zinc-400"
        >
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
        </main>
      ) : (
        <VideoCardRow>
          {filtered.map((video, index) => (
            <div
              key={video.slug}
              data-video-slug={video.slug}
              // From md up the footer is fixed, so the card has to fit between the page
              // header and the footer. 34rem covers both plus the card's text block; the
              // 16/9 factor turns the leftover height back into a card width.
              className="w-[min(88vw,32rem)] shrink-0 md:w-[34rem] md:max-w-[max(18rem,calc((100dvh-34rem)*16/9))] lg:w-[36rem]"
            >
              <VideoCard
                title={getTitle(video)}
                shortDescription={getSubtitle(video)}
                thumbnailUrl={video.thumbnailUrl}
                thumbnailAlt={t("thumbnailAlt", { title: getTitle(video) })}
                href={`/video/${video.slug}`}
                priority={index === 0}
              />
            </div>
          ))}
        </VideoCardRow>
      )}
    </div>
  );
}
