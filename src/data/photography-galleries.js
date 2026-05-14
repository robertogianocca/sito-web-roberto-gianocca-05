/**
 * Elenco gallerie: testi in repo, immagini su Cloudinary nella cartella `folder`.
 * Copertina (opzionale): asset nella stessa cartella il cui public_id ha ultimo segmento `cover`.
 * Se presente, viene usata sulla card e non entra nel carosello. Senza cover, la galleria mostra comunque le altre immagini.
 *
 * @type {Array<{ slug: string, title: string, shortDescription: string, folder: string }>}
 */
export const PHOTOGRAPHY_GALLERIES = [
  {
    slug: "slava-snowshow",
    title: "Slava's Snowshow",
    shortDescription: "Immagini dalla produzione.",
    folder: "Roberto Gianocca/Portfolio/Photography/Slava's Snowshow",
  },
];

/**
 * @param {string} slug
 * @returns {{ slug: string, title: string, shortDescription: string, folder: string } | null}
 */
export function getPhotographyGalleryBySlug(slug) {
  return PHOTOGRAPHY_GALLERIES.find((g) => g.slug === slug) ?? null;
}

/** Parametri per `generateStaticParams` su `/photography/[slug]`. */
export function getPhotographyGalleryStaticParams() {
  return PHOTOGRAPHY_GALLERIES.map((g) => ({ slug: g.slug }));
}
