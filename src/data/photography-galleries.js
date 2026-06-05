/**
 * Elenco gallerie: testi in repo, immagini su Cloudinary nella cartella `folder`.
 * Copertina (opzionale): asset nella stessa cartella il cui public_id ha ultimo segmento `cover`.
 * Se presente, viene usata sulla card e non entra nel carosello. Senza cover, la galleria mostra comunque le altre immagini.
 *
 * `shortDescription`: Markdown inline — es. **grassetto**, *corsivo*, [etichetta](https://…), [pagina](/path).
 * `tags` (opzionale): array di stringhe per filtrare le gallerie nella listing page (es. ["Teatro", "Drone"]).
 *
 * @type {Array<{ slug: string, title: string, shortDescription: string, folder: string, tags?: string[] }>}
 */
export const PHOTOGRAPHY_GALLERIES = [
  {
    slug: "slava-snowshow",
    title: "Slava's Snowshow",
    shortDescription:
      "La Prima ebbe luogo a Mosca nell'ottobre del 1993. Lo *Slava's Snowshow* è lo spettacolo creato e messo in scena dall'artista russo Slava Polunin. Poesia sulle orme di Pushkin, Gogol, Chekhov, Kandinsky, Chagall, Eisenstein, Tarkovsky, Stravinsky, Prokofiev.",
    folder: "Roberto Gianocca/Portfolio/Photography/Slava's Snowshow",
    tags: ["Teatro"],
  },
];

/**
 * @param {string} slug
 * @returns {{ slug: string, title: string, shortDescription: string, folder: string, tags?: string[] } | null}
 */
export function getPhotographyGalleryBySlug(slug) {
  return PHOTOGRAPHY_GALLERIES.find((g) => g.slug === slug) ?? null;
}

/** Parametri per `generateStaticParams` su `/photography/[slug]`. */
export function getPhotographyGalleryStaticParams() {
  return PHOTOGRAPHY_GALLERIES.map((g) => ({ slug: g.slug }));
}
