/**
 * Fetches the thumbnail URL for a Vimeo video using the public oEmbed API.
 * No API key required. Response is cached by Next.js for 24 hours.
 *
 * @param {string} vimeoId - digits-only Vimeo video ID
 * @returns {Promise<string | null>}
 */
export async function fetchVimeoThumbnail(vimeoId) {
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}&width=1280`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.thumbnail_url === "string" ? data.thumbnail_url : null;
  } catch {
    return null;
  }
}
