/**
 * Elenco video: testi e id Vimeo in repo; player da `https://player.vimeo.com/video/{id}`.
 * Anteprima card (opzionale): `thumbnailUrl` HTTPS; senza, la card mostra un segnaposto.
 *
 * `title` e `subtitle` possono essere stringhe (una sola lingua) o oggetti `{ it, en }`.
 * `subtitle` supporta markdown inline per parti in corsivo, es. `Music video for *Matt Pascale & The Stomps*`.
 * `credits` (opzionale): array di `{ role, names }` — `role` localizzato, `names` testo piano.
 * `tags` (opzionale): array di stringhe per filtrare i video nella listing page (es. ["Drone", "Live"]).
 * `featured` (opzionale): `true` per il video in evidenza in homepage. Solo il primo `featured: true`
 *   viene usato; se nessuno è marcato si usa `VIDEOS[0]`.
 *
 * @type {Array<{
 *   slug: string,
 *   title: string | { it: string, en: string },
 *   subtitle: string | { it: string, en: string },
 *   vimeoId: string | number,
 *   credits?: Array<{ role: string | { it: string, en: string }, names: string }>,
 *   thumbnailUrl?: string,
 *   tags?: string[],
 *   featured?: boolean
 * }>}
 */
export const VIDEOS = [
  {
    slug: "sugar-mama",
    title: "Sugar Mama",
    subtitle: {
      it: "Video musicale per *Matt Pascale & The Stomps*",
      en: "Music video for *Matt Pascale & The Stomps*",
    },
    credits: [
      {
        role: {
          it: "Regia, Montaggio, Post-produzione",
          en: "Direction, Editing, Post-production",
        },
        names: "Roberto Gianocca",
      },
      {
        role: { it: "Assistente alla regia", en: "Assistant Director" },
        names: "Shondel Bervini",
      },
      {
        role: { it: "Styling e costumi", en: "Styling & Costumes" },
        names: "Shondel Bervini, Sofia Buob",
      },
      {
        role: { it: "Trucco e acconciatura", en: "Make-up & Hair" },
        names: "Sofia Buob",
      },
      {
        role: { it: "Interpreti", en: "Performers" },
        names: "Matt Pascale, Sofia Buob, Shondel Bervini",
      },
      {
        role: { it: "Ringraziamenti speciali", en: "Special Thanks" },
        names:
          "Elia Squartini, Gianni Muggeo, Andrea Zanni, Alan Fraquelli, Maurizio Faggi, Giulia Campiglia, Wabi the Dog",
      },
    ],
    vimeoId: "1132948199",
    thumbnailUrl:
      "https://res.cloudinary.com/dqwtukgp2/image/upload/v1767704679/sugar-mama-thumbnail_mduage.jpg",
    featured: true,
  },
  {
    slug: "hot-sky",
    title: "Hot Sky",
    subtitle: {
      it: "Video musicale per *the Yuna Hawks*",
      en: "Music video for *the Yuna Hawks*",
    },
    credits: [
      {
        role: {
          it: "Regia, Camera, Montaggio, Post-produzione",
          en: "Direction, Camera, Editing, Post-production",
        },
        names: "Roberto Gianocca",
      },
      {
        role: { it: "Collaborazione e assistenza", en: "Collaboration and Assistance" },
        names: "Caroline Cavalcante, Matteo Marazzi",
      },
      {
        role: { it: "Assistenza tecnica robot", en: "Robot Technical Assistance" },
        names: "Carrara Modellismo",
      },
    ],
    vimeoId: "1133440458",
    thumbnailUrl:
      "https://res.cloudinary.com/dqwtukgp2/image/upload/v1767534097/hot-sky-thumbnail_aktcgh.jpg",
  },
  {
    slug: "carie",
    title: "CARIE",
    subtitle: {
      it: "Documentario sportivo sulle *cave di Carrara*",
      en: "Sports documentary film about *Carrara’s quarries*",
    },
    credits: [
      {
        role: { it: "Regia", en: "Direction" },
        names: "Achille Mauri, Marzio Nardi, Federico Ravassard",
      },
      {
        role: { it: "Montaggio", en: "Editing" },
        names: "Achille Mauri",
      },
      {
        role: {
          it: "Assistente alla ripresa, Drone, Color grading, Animazione",
          en: "Camera assistant, Drone, Grading, Animation",
        },
        names: "Roberto Gianocca",
      },
      {
        role: { it: "Arrampicatori", en: "Climbers" },
        names: "Francesca Medici, Lorenzo Carasio, Luca Andreozzi, Luca Bana",
      },
      {
        role: { it: "Colonna sonora", en: "Soundtrack" },
        names: "Andrea La Pietra",
      },
      {
        role: { it: "Mix e sound design", en: "Mix and Sound Design" },
        names: "Tommaso Simonetta",
      },
      {
        role: { it: "Personaggi", en: "Characters" },
        names: "Marzio Nardi, Roberto Bombarda, Chiara Taponecco, Eros Tetti",
      },
    ],
    vimeoId: "676793805",
    thumbnailUrl:
      "https://res.cloudinary.com/dqwtukgp2/image/upload/v1767538035/carie-thumbnail_j2yoq7.jpg",
  },
  {
    slug: "met-parachute-mcr",
    title: "MET Parachute MCR",
    subtitle: {
      it: "Commercial per *MET Helmets Parachute MCR*",
      en: "Commercial for *MET Helmets Parachute MCR*",
    },
    credits: [
      {
        role: { it: "Regia", en: "Direction" },
        names: "Achille Mauri",
      },
      {
        role: { it: "Montaggio", en: "Editing" },
        names: "Achille Mauri",
      },
      {
        role: {
          it: "Assistente alla ripresa, Drone, Color grading, Animazione",
          en: "Camera assistant, Drone, Grading, Animation",
        },
        names: "Roberto Gianocca",
      },
      {
        role: { it: "Colonna sonora", en: "Soundtrack" },
        names: "Andrea La Pietra",
      },
      {
        role: { it: "Mix e sound design", en: "Mix and Sound Design" },
        names: "Andrea Colosio",
      },
    ],
    vimeoId: "676799834",
    thumbnailUrl:
      "https://res.cloudinary.com/dqwtukgp2/image/upload/v1771599457/met-parachute-thumbnail_djjbmb.jpg",
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
 * @returns {(typeof VIDEOS)[number] | null}
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
