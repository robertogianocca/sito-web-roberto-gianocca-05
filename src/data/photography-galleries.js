/**
 * Elenco gallerie: testi in repo, immagini su Cloudinary nella cartella `folder`.
 * Copertina (opzionale): asset nella stessa cartella il cui public_id ha ultimo segmento `cover`.
 * Se presente, viene usata sulla card e non entra nel carosello. Senza cover, la galleria mostra comunque le altre immagini.
 *
 * `title` e `shortDescription` possono essere stringhe (una sola lingua) o oggetti `{ it, en }`.
 * `shortDescription`: Markdown inline — es. **grassetto**, *corsivo*, [etichetta](https://…), [pagina](/path).
 * `tags` (opzionale): array di stringhe per filtrare le gallerie nella listing page (es. ["Teatro", "Drone"]).
 * `featured` (opzionale): `true` per la galleria in evidenza in homepage (slot A del mosaico, carosello).
 *   Solo la prima con `featured: true` viene usata; se nessuna è marcata si usa `PHOTOGRAPHY_GALLERIES[0]`.
 * `homeImageCount` (opzionale): quante immagini caricare per il carosello homepage (default 4).
 *   Ignorato se `homeImages` è impostato.
 * `homeImages` (opzionale): array di public_id Cloudinary specifici per il carosello homepage.
 *   Se omesso, vengono usate le prime `homeImageCount` slide della cartella.
 *
 * `homeImageAspect` (opzionale): proporzione del contenitore slot A in homepage e delle thumbnail recenti.
 *   Valori consentiti: `'4/5'` (portrait), `'2/3'` (portrait), `'4/3'` (landscape).
 *   Le immagini del carosello vengono adattate con `object-contain` senza ritaglio. Default `'4/3'`.
 *
 * @type {Array<{
 *   slug: string,
 *   title: string | { it: string, en: string },
 *   shortDescription: string | { it: string, en: string },
 *   folder: string,
 *   tags?: string[],
 *   featured?: boolean,
 *   homeImageCount?: number,
 *   homeImages?: string[],
 *   homeImageAspect?: string
 * }>}
 */
export const PHOTOGRAPHY_GALLERIES = [
  {
    slug: "slava-snowshow",
    title: {
      it: "Slava's Snowshow",
      en: "Slava's Snowshow",
    },
    shortDescription: {
      it: "La Prima ebbe luogo a Mosca nell'ottobre del 1993. Lo *Slava's Snowshow* è lo spettacolo creato e messo in scena dall'artista russo Slava Polunin. Poesia sulle orme di Pushkin, Gogol, Chekhov, Kandinsky, Chagall, Eisenstein, Tarkovsky, Stravinsky, Prokofiev.",
      en: "The premiere took place in Moscow in October 1993. *Slava's Snowshow* is the show created and staged by Russian artist Slava Polunin. Poetry in the footsteps of Pushkin, Gogol, Chekhov, Kandinsky, Chagall, Eisenstein, Tarkovsky, Stravinsky, Prokofiev.",
    },
    folder: "Roberto Gianocca/Portfolio/Photography/Slava's Snowshow",
    tags: ["Teatro"],
    featured: true,
    homeImageCount: 4,
    homeImageAspect: '4/3',
  },
];

/**
 * @param {string} slug
 * @returns {{ slug: string, title: { it: string, en: string } | string, shortDescription: { it: string, en: string } | string, folder: string, tags?: string[], featured?: boolean, homeImageCount?: number, homeImages?: string[], homeImageAspect?: string } | null}
 */
export function getPhotographyGalleryBySlug(slug) {
  return PHOTOGRAPHY_GALLERIES.find((g) => g.slug === slug) ?? null;
}

/** Parametri per `generateStaticParams` su `/[locale]/photography/[slug]`. */
export function getPhotographyGalleryStaticParams() {
  return PHOTOGRAPHY_GALLERIES.map((g) => ({ slug: g.slug }));
}

/**
 * Ritorna la galleria in evidenza per il mosaico homepage (slot A, carosello).
 * Usa la prima con `featured: true`; fallback a `PHOTOGRAPHY_GALLERIES[0]`; null se vuoto.
 * @returns {(typeof PHOTOGRAPHY_GALLERIES)[number] | null}
 */
export function getFeaturedGallery() {
  if (PHOTOGRAPHY_GALLERIES.length === 0) return null;
  return PHOTOGRAPHY_GALLERIES.find((g) => g.featured === true) ?? PHOTOGRAPHY_GALLERIES[0];
}

/**
 * Ritorna i primi `n` gallery non featured per gli slot B e C del mosaico.
 * @param {number} n
 * @returns {(typeof PHOTOGRAPHY_GALLERIES)[number][]}
 */
export function getSideGalleries(n) {
  const featured = getFeaturedGallery();
  return PHOTOGRAPHY_GALLERIES.filter((g) => g !== featured).slice(0, n);
}

/**
 * Ritorna le gallerie per la riga thumbnail, escludendo featured e side galleries.
 * @param {number} sideCount quante gallerie sono già usate negli slot B/C
 * @param {number} n quante thumbnail restituire
 * @returns {(typeof PHOTOGRAPHY_GALLERIES)[number][]}
 */
export function getRecentGalleries(sideCount, n) {
  const featured = getFeaturedGallery();
  return PHOTOGRAPHY_GALLERIES.filter((g) => g !== featured).slice(sideCount, sideCount + n);
}
