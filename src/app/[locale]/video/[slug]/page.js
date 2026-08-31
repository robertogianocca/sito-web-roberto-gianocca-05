import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { VimeoPlayer } from "@/components/video/VimeoPlayer";
import { VideoCredits } from "@/components/video/VideoCredits";
import { PhotographyRichDescription } from "@/components/photography/PhotographyRichDescription";
import { BackLink } from "@/components/shared/BackLink";
import { ErrorPanel } from "@/components/shared/ErrorPanel";
import { resolveLocalized } from "@/lib/i18n-content";
import { plainTextFromMarkdown } from "@/lib/plain-text-from-markdown";
import { getVideoBySlug, getVideoStaticParams, normalizeVimeoId } from "@/data/videos";

export const dynamicParams = false;

export function generateStaticParams() {
  return getVideoStaticParams();
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const video = getVideoBySlug(slug);
  if (!video) {
    return { title: "Video | Roberto Gianocca" };
  }
  const title = resolveLocalized(video.title, locale);
  const description = plainTextFromMarkdown(resolveLocalized(video.subtitle, locale));
  return {
    title: `${title} | Video | Roberto Gianocca`,
    description,
    alternates: buildAlternates(`/video/${slug}`, routing),
  };
}

export default async function VideoDetailPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Video");
  const video = getVideoBySlug(slug);
  if (!video) {
    notFound();
  }

  const title = resolveLocalized(video.title, locale);
  const subtitle = resolveLocalized(video.subtitle, locale);

  const vimeoId = normalizeVimeoId(video.vimeoId);
  if (!vimeoId) {
    return (
      <ErrorPanel
        backHref="/video"
        backLabel="Video"
        title={t("errorInvalidIdTitle")}
        body={t("errorInvalidIdBody")}
      />
    );
  }

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col gap-8 py-8 md:py-12 lg:flex-row lg:items-start lg:gap-10">
        <div className="shrink-0 space-y-6 px-6 md:px-10 lg:w-md lg:max-w-md">
          <BackLink href="/video" label="Video" />

          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {title}
            </h1>
            <PhotographyRichDescription markdown={subtitle} />
          </header>

          {video.credits?.length ? (
            <VideoCredits credits={video.credits} locale={locale} />
          ) : null}
        </div>

        <div className="min-w-0 flex-1 px-6 md:px-10 lg:px-0 lg:pr-10">
          <VimeoPlayer vimeoId={vimeoId} title={title} className="max-w-none" />
        </div>
      </div>
    </div>
  );
}
