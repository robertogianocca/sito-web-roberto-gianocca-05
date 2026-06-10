/**
 * Elenco video: testi e id Vimeo in repo; player da `https://player.vimeo.com/video/{id}`.
 * Anteprima card (opzionale): `thumbnailUrl` HTTPS; senza, la card mostra un segnaposto.
 *
 * `title` e `shortDescription` possono essere stringhe (una sola lingua) o oggetti `{ it, en }`.
 * `tags` (opzionale): array di stringhe per filtrare i video nella listing page (es. ["Drone", "Live"]).
 * `featured` (opzionale): `true` per il video in evidenza in homepage. Solo il primo `featured: true`
 *   viene usato; se nessuno è marcato si usa `VIDEOS[0]`.
 *
 * @type {Array<{
 *   slug: string,
 *   title: string | { it: string, en: string },
 *   shortDescription: string | { it: string, en: string },
 *   vimeoId: string | number,
 *   thumbnailUrl?: string,
 *   tags?: string[],
 *   featured?: boolean
 * }>}
 */
export const VIDEOS = [
  {
    slug: "esempio-vimeo",
    title: {
      it: "Esempio Vimeo",
      en: "Vimeo Example",
    },
    shortDescription: {
      it: "Video di esempio dal player Vimeo (sostituisci slug e vimeoId con i tuoi contenuti).",
      en: "Sample video from Vimeo player (replace slug and vimeoId with your own content).",
    },
    vimeoId: "1132948199",
    featured: true,
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
 * @returns {{ slug: string, title: { it: string, en: string } | string, shortDescription: { it: string, en: string } | string, vimeoId: string | number, thumbnailUrl?: string, tags?: string[] } | null}
 */
export function getVideoBySlug(slug) {
  return VIDEOS.find((v) => v.slug === slug) ?? null;
}

/** Parametri per `generateStaticParams` su `/[locale]/video/[slug]`. */
export function getVideoStaticParams() {
  return VIDEOS.map((v) => ({ slug: v.slug }));
}

/**
 * Ritorna il video con `featured: true`; se nessuno è marcato, usa `VIDEOS[0]`.
 * Ritorna `null` se il manifest è vuoto.
 * @returns {(typeof VIDEOS)[number] | null}
 */
export function getFeaturedVideo() {
  if (VIDEOS.length === 0) return null;
  return VIDEOS.find((v) => v.featured === true) ?? VIDEOS[0];
}

/**
 * Ritorna `n` video per la riga thumbnail in homepage.
 * Preferisce quelli diversi dal featured; se non ce ne sono abbastanza,
 * riempie con il featured stesso così la riga non è mai vuota.
 * @param {number} n
 * @returns {(typeof VIDEOS)[number][]}
 */
export function getRecentVideos(n) {
  const featured = getFeaturedVideo();
  const others = VIDEOS.filter((v) => v !== featured);
  const result = others.slice(0, n);
  if (result.length < n && featured) {
    while (result.length < n) result.push(featured);
  }
  return result;
}
