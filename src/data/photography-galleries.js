/**
 * Elenco gallerie: testi in repo, immagini su Cloudinary nella cartella `folder`.
 * Cover: asset nella stessa cartella il cui public_id ha ultimo segmento `cover` (es. `…/mioAlbum/cover`; su Cloudinary il “nome” dell’asset è spesso solo `cover` nella cartella). Non entra nel carosello.
 *
 * @type {Array<{ slug: string, title: string, shortDescription: string, folder: string }>}
 */
export const PHOTOGRAPHY_GALLERIES = [
  {
    slug: "sicilia",
    title: "Sicilia",
    shortDescription: "Notturni e paesaggi costieri.",
    folder: "TALETE/Portfolio/Photography",
  },
];

/**
 * @param {string} slug
 * @returns {{ slug: string, title: string, shortDescription: string, folder: string } | null}
 */
export function getPhotographyGalleryBySlug(slug) {
  return PHOTOGRAPHY_GALLERIES.find((g) => g.slug === slug) ?? null;
}