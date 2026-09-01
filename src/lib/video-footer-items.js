import { VIDEOS } from "@/data/videos";
import { resolveLocalized } from "@/lib/i18n-content";

/**
 * @param {string} locale
 * @param {string | null} activeTag
 */
export function getVideoFooterItems(locale, activeTag = null) {
  const filtered =
    activeTag !== null
      ? VIDEOS.filter((v) => (v.tags ?? []).includes(activeTag))
      : VIDEOS;

  return filtered.map((video) => {
    const title = resolveLocalized(video.title, locale);
    return {
      slug: video.slug,
      title,
      thumbnailUrl: video.thumbnailUrl,
      thumbnailAlt: title,
    };
  });
}
