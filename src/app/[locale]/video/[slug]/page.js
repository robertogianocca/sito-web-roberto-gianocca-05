import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { VimeoPlayer } from "@/components/video/VimeoPlayer";
import { BackLink } from "@/components/shared/BackLink";
import { ErrorPanel } from "@/components/shared/ErrorPanel";
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
  const title =
    typeof video.title === "object" ? (video.title[locale] ?? video.title.en) : video.title;
  const description =
    typeof video.shortDescription === "object"
      ? (video.shortDescription[locale] ?? video.shortDescription.en)
      : video.shortDescription;
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

  const title =
    typeof video.title === "object" ? (video.title[locale] ?? video.title.en) : video.title;
  const description =
    typeof video.shortDescription === "object"
      ? (video.shortDescription[locale] ?? video.shortDescription.en)
      : video.shortDescription;

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
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 md:px-10 md:py-12">
        <BackLink href="/video" label="Video" />

        <header className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
        </header>

        <VimeoPlayer vimeoId={vimeoId} title={title} />
      </div>
    </div>
  );
}
