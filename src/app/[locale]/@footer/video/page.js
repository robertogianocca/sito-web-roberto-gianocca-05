import { getTranslations, setRequestLocale } from "next-intl/server";
import { VideoFooterThumbnails } from "@/components/video/VideoFooterThumbnails.client";
import { getVideoFooterItems } from "@/lib/video-footer-items";

export default async function VideoListingFooter({ params, searchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Video");
  const { tag } = await searchParams;
  const activeTag = typeof tag === "string" && tag.length > 0 ? tag : null;

  const videos = getVideoFooterItems(locale, activeTag).map((video) => ({
    ...video,
    thumbnailAlt: t("thumbnailAlt", { title: video.title }),
  }));

  return <VideoFooterThumbnails videos={videos} mode="listing" />;
}
