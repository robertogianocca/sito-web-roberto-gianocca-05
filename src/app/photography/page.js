import Image from "next/image";
import Link from "next/link";
import { PHOTOGRAPHY_GALLERIES } from "../../data/photography-galleries";
import { PhotographyGalleryCard } from "../../components/photography/PhotographyGalleryCard";
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

export default async function PhotographyPage() {
  const entries = await Promise.all(
    PHOTOGRAPHY_GALLERIES.map(async (gallery) => {
      const { coverSrc, footnote } = await resolveGalleryCover(gallery);
      return { gallery, coverSrc, footnote };
    }),
  );

  const probe = SHOW_CLOUDINARY_PROBE
    ? await fetchCloudinaryResourceProbe(CLOUDINARY_PROBE_PUBLIC_ID)
    : null;

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200/80 bg-background/80 px-6 py-6 backdrop-blur dark:border-zinc-800/80 md:px-0">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-foreground hover:underline dark:text-zinc-400"
            >
              ← Torna al portfolio
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Photography
            </h1>
            <p className="max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
              Gallerie su Cloudinary. Opzionale: un’immagine il cui{" "}
              <strong className="font-medium text-foreground">nome</strong> (ultimo segmento del
              public id) è{" "}
              <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-xs dark:bg-zinc-800/80">
                cover
              </code>{" "}
              per la card; non entra nel carosello. Senza cover, sulla card compare un segnaposto e
              le altre foto restano comunque nella galleria. Dopo modifiche su Cloudinary usa{" "}
              <Link
                href="/photography/revalidate-cache"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                rigenera cache
              </Link>
              .
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:px-0 md:py-12">
        <div
          className={
            SHOW_CLOUDINARY_PROBE && probe
              ? "flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12"
              : ""
          }
        >
          {SHOW_CLOUDINARY_PROBE && probe ? (
            <aside className="shrink-0 space-y-4 lg:sticky lg:top-8 lg:w-[min(100%,22rem)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Verifica Cloudinary (dev)
              </p>
              {probe.ok ? (
                <>
                  <dl className="space-y-1 rounded-lg border border-zinc-200/90 bg-background p-4 text-xs text-zinc-600 dark:border-zinc-800/90 dark:text-zinc-400">
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-500">Public ID</dt>
                      <dd className="font-mono text-right text-foreground">{probe.publicId}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-500">Cloud</dt>
                      <dd className="font-mono text-right">{probe.cloudName}</dd>
                    </div>
                    {probe.width != null ? (
                      <div className="flex justify-between gap-2">
                        <dt className="text-zinc-500">Dimensioni</dt>
                        <dd>
                          {probe.width}×{probe.height} · {probe.format} ·{" "}
                          {probe.bytes != null ? `${Math.round(probe.bytes / 1024)} KB` : "—"}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-100 dark:border-zinc-800/90 dark:bg-zinc-900">
                    <Image
                      src={probe.previewSrc}
                      alt="Anteprima verifica API Cloudinary"
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 22rem"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Abilita con{" "}
                    <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-900">
                      PHOTOGRAPHY_ENABLE_PROBE=1
                    </code>
                    . Opzionale:{" "}
                    <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-900">
                      PHOTOGRAPHY_PROBE_PUBLIC_ID
                    </code>
                    .
                  </p>
                </>
              ) : (
                <div className="rounded-lg border border-amber-200/90 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
                  <p className="font-medium">Fetch non riuscito</p>
                  <p className="mt-1 text-xs opacity-90">
                    {probe.reason === "missing_env"
                      ? "Variabili CLOUDINARY_* mancanti."
                      : (probe.message ?? probe.reason)}
                  </p>
                </div>
              )}
            </aside>
          ) : null}

          <div className="min-w-0 flex-1">
            {entries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300/80 bg-background p-8 text-zinc-600 dark:border-zinc-700/80 dark:text-zinc-400">
                <p className="font-medium text-foreground">Nessuna galleria in elenco</p>
                <p className="mt-2 text-sm leading-relaxed">
                  Aggiungi voci in{" "}
                  <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
                    src/data/photography-galleries.js
                  </code>{" "}
                  (slug, titolo, descrizione, cartella Cloudinary). Imposta{" "}
                  <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
                    CLOUDINARY_*
                  </code>{" "}
                  per il build e il deploy.
                </p>
              </div>
            ) : (
              <ul className="grid gap-8 md:grid-cols-3">
                {entries.map(({ gallery, coverSrc, footnote }) => (
                  <li key={gallery.slug}>
                    <PhotographyGalleryCard
                      title={gallery.title}
                      shortDescription={gallery.shortDescription}
                      coverSrc={coverSrc}
                      coverAlt={`Copertina: ${gallery.title}`}
                      footnote={footnote}
                      href={`/photography/${gallery.slug}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
