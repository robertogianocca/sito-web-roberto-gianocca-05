import { PHOTOGRAPHY_GALLERIES } from "../../data/photography-galleries";
import { CloudinaryProbePanel } from "../../components/photography/CloudinaryProbePanel";
import { PhotographyGalleryCard } from "../../components/photography/PhotographyGalleryCard";
import { BackLink } from "../../components/shared/BackLink";
import { PageShell } from "../../components/shared/PageShell";
import { TagFilter } from "../../components/shared/TagFilter";
import {
  fetchCloudinaryResourceProbe,
  fetchFolderGallery,
  isCloudinaryConfigured,
} from "../../lib/cloudinary-server";

const SHOW_CLOUDINARY_PROBE = process.env.PHOTOGRAPHY_ENABLE_PROBE === "1";

/** Public id di test solo se `PHOTOGRAPHY_ENABLE_PROBE=1` (opzionale). */
const CLOUDINARY_PROBE_PUBLIC_ID = process.env.PHOTOGRAPHY_PROBE_PUBLIC_ID ?? "02_olvllg";

export const metadata = {
  title: "Photography | Roberto Gianocca",
  description: "Gallerie fotografiche.",
};

/** Raccoglie tutti i tag unici dall'intero manifest, ordinati alfabeticamente. */
function collectAllTags(galleries) {
  const set = new Set();
  for (const g of galleries) {
    for (const tag of g.tags ?? []) {
      set.add(tag);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "it"));
}

async function resolveGalleryCover(gallery) {
  try {
    if (!isCloudinaryConfigured()) {
      return {
        coverSrc: null,
        footnote: "Cloudinary non configurato: imposta CLOUDINARY_* in .env.local.",
      };
    }

    const payload = await fetchFolderGallery(gallery.folder);
    if (!payload.ok) {
      if (payload.reason === "empty_folder") {
        return {
          coverSrc: null,
          footnote: "Cartella vuota su Cloudinary o percorso `folder` errato nel manifest.",
        };
      }
      return { coverSrc: null, footnote: "Impossibile caricare la galleria da Cloudinary." };
    }

    return { coverSrc: payload.coverSrc, footnote: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      coverSrc: null,
      footnote: `Errore Cloudinary: ${message}`,
    };
  }
}

export default async function PhotographyPage({ searchParams }) {
  const { tag } = await searchParams;
  const activeTag = typeof tag === "string" && tag.length > 0 ? tag : null;

  const allTags = collectAllTags(PHOTOGRAPHY_GALLERIES);

  const filtered =
    activeTag !== null
      ? PHOTOGRAPHY_GALLERIES.filter((g) => (g.tags ?? []).includes(activeTag))
      : PHOTOGRAPHY_GALLERIES;

  const entries = await Promise.all(
    filtered.map(async (gallery) => {
      const { coverSrc, footnote } = await resolveGalleryCover(gallery);
      return { gallery, coverSrc, footnote };
    }),
  );

  const probe = SHOW_CLOUDINARY_PROBE
    ? await fetchCloudinaryResourceProbe(CLOUDINARY_PROBE_PUBLIC_ID)
    : null;

  return (
    <PageShell
      header={
        <div className="space-y-2">
          <BackLink href="/" label="Torna al portfolio" />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Photography
          </h1>
          <p className="max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
            Gallerie su Cloudinary. Opzionale: un&apos;immagine il cui{" "}
            <strong className="font-medium text-foreground">nome</strong> (ultimo segmento del
            public id) &egrave;{" "}
            <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-xs dark:bg-zinc-800/80">
              cover
            </code>{" "}
            per la card; non entra nel carosello. Senza cover, sulla card compare un segnaposto e
            le altre foto restano comunque nella galleria. Dopo modifiche su Cloudinary usa{" "}
            <a
              href="/photography/revalidate-cache"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              rigenera cache
            </a>
            .
          </p>
          <TagFilter basePath="/photography" tags={allTags} activeTag={activeTag} />
        </div>
      }
    >
      <div className={probe ? "flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12" : ""}>
        <CloudinaryProbePanel probe={probe} />

        <div className="min-w-0 flex-1">
          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300/80 bg-background p-8 text-zinc-600 dark:border-zinc-700/80 dark:text-zinc-400">
              <p className="font-medium text-foreground">
                {activeTag
                  ? `Nessuna galleria con il tag "${activeTag}"`
                  : "Nessuna galleria in elenco"}
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                {activeTag ? (
                  <>
                    Prova a selezionare un altro tag oppure{" "}
                    <a
                      href="/photography"
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      mostra tutte le gallerie
                    </a>
                    .
                  </>
                ) : (
                  <>
                    Aggiungi voci in{" "}
                    <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
                      src/data/photography-galleries.js
                    </code>{" "}
                    (slug, titolo, descrizione, cartella Cloudinary). Imposta{" "}
                    <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
                      CLOUDINARY_*
                    </code>{" "}
                    per il build e il deploy.
                  </>
                )}
              </p>
            </div>
          ) : (
            <ul className="grid gap-8 md:grid-cols-3">
              {entries.map(({ gallery, coverSrc, footnote }, i) => (
                <li key={gallery.slug}>
                  <PhotographyGalleryCard
                    title={gallery.title}
                    shortDescription={gallery.shortDescription}
                    coverSrc={coverSrc}
                    coverAlt={`Copertina: ${gallery.title}`}
                    footnote={footnote}
                    href={`/photography/${gallery.slug}`}
                    coverPreload={i === 0 && Boolean(coverSrc)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}
