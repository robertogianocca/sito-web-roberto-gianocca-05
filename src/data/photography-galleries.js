/**
 * Elenco gallerie: testi in repo, immagini su Cloudinary nella cartella `folder`.
 * Copertina (opzionale): asset nella stessa cartella il cui public_id ha ultimo segmento `cover`.
 * Se presente, viene usata sulla card e non entra nel carosello. Senza cover, la galleria mostra comunque le altre immagini.
 *
 * `title` e `shortDescription` possono essere stringhe (una sola lingua) o oggetti `{ it, en }`.
 * `shortDescription`: Markdown inline — es. **grassetto**, *corsivo*, [etichetta](https://…), [pagina](/path).
 * `tags` (opzionale): array di stringhe per filtrare le gallerie nella listing page (es. ["Teatro", "Drone"]).
 *
 * @type {Array<{
 *   slug: string,
 *   title: string | { it: string, en: string },
 *   shortDescription: string | { it: string, en: string },
 *   folder: string,
 *   tags?: string[]
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
  },
];

/**
 * @param {string} slug
 * @returns {{ slug: string, title: { it: string, en: string } | string, shortDescription: { it: string, en: string } | string, folder: string, tags?: string[] } | null}
 */
export function getPhotographyGalleryBySlug(slug) {
  return PHOTOGRAPHY_GALLERIES.find((g) => g.slug === slug) ?? null;
}

/** Parametri per `generateStaticParams` su `/[locale]/photography/[slug]`. */
export function getPhotographyGalleryStaticParams() {
  return PHOTOGRAPHY_GALLERIES.map((g) => ({ slug: g.slug }));
}
