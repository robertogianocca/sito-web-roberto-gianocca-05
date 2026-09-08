/**
 * Fetches public Vimeo metadata through oEmbed.
 * No API key required. Response is cached by Next.js for 24 hours.
 *
 * @param {string} vimeoId - digits-only Vimeo video ID
 * @returns {Promise<{ thumbnailUrl: string | null; duration: number | null } | null>}
 */
export async function fetchVimeoMetadata(vimeoId) {
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}&width=1280`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;

    const data = await res.json();
    return {
      thumbnailUrl:
        typeof data.thumbnail_url === "string" ? data.thumbnail_url : null,
      duration:
        Number.isFinite(data.duration) && data.duration >= 0
          ? Math.floor(data.duration)
          : null,
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} vimeoId - digits-only Vimeo video ID
 * @returns {Promise<string | null>}
 */
export async function fetchVimeoThumbnail(vimeoId) {
  const metadata = await fetchVimeoMetadata(vimeoId);
  return metadata?.thumbnailUrl ?? null;
}

/**
 * Formats a duration in seconds as m:ss or h:mm:ss.
 *
 * @param {number | null | undefined} totalSeconds
 * @returns {string | null}
 */
export function formatVideoDuration(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return null;
  }

  const wholeSeconds = Math.floor(totalSeconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const seconds = wholeSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours === 0) {
    return `${minutes}:${paddedSeconds}`;
  }

  return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
}
