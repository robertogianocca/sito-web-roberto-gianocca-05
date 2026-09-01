import { getTranslations, setRequestLocale } from "next-intl/server";
import { VideoFooterThumbnails } from "@/components/video/VideoFooterThumbnails.client";
import { getVideoFooterItems } from "@/lib/video-footer-items";

export default async function VideoDetailFooter({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Video");

  const videos = getVideoFooterItems(locale).map((video) => ({
    ...video,
    thumbnailAlt: t("thumbnailAlt", { title: video.title }),
  }));

  return (
    <VideoFooterThumbnails videos={videos} activeSlug={slug} mode="detail" />
  );
}
