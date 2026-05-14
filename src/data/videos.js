/**
 * Elenco video: testi e id Vimeo in repo; player da `https://player.vimeo.com/video/{id}`.
 * Anteprima card (opzionale): `thumbnailUrl` HTTPS; senza, la card mostra un segnaposto.
 *
 * @type {Array<{ slug: string, title: string, shortDescription: string, vimeoId: string | number, thumbnailUrl?: string }>}
 */
export const VIDEOS = [
  {
    slug: "esempio-vimeo",
    title: "Esempio Vimeo",
    shortDescription:
      "Video di esempio dal player Vimeo (sostituisci slug e vimeoId con i tuoi contenuti).",
    vimeoId: "1132948199",
  },
];

/**
 * Normalizza l'id Vimeo per costruire URL sicuri (solo cifre).
 * @param {string | number} raw
 * @returns {string | null}
 */
export function normalizeVimeoId(raw) {
  const s = String(raw).trim();
  if (!/^\d+$/.test(s)) {
    return null;
  }
  return s;
}

/**
 * @param {string} slug
 * @returns {{ slug: string, title: string, shortDescription: string, vimeoId: string | number, thumbnailUrl?: string } | null}
 */
export function getVideoBySlug(slug) {
  return VIDEOS.find((v) => v.slug === slug) ?? null;
}

/** Parametri per `generateStaticParams` su `/video/[slug]`. */
export function getVideoStaticParams() {
  return VIDEOS.map((v) => ({ slug: v.slug }));
}
