import { VIDEOS } from "@/data/videos";
import { resolveLocalized } from "@/lib/i18n-content";
import { plainTextFromMarkdown } from "@/lib/plain-text-from-markdown";

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
      subtitle: plainTextFromMarkdown(resolveLocalized(video.subtitle, locale)),
      thumbnailUrl: video.thumbnailUrl,
      thumbnailAlt: title,
    };
  });
}
