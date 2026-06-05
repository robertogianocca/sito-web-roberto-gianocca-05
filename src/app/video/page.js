import { VIDEOS } from "../../data/videos";
import { VideoCard } from "../../components/video/VideoCard";
import { BackLink } from "../../components/shared/BackLink";
import { PageShell } from "../../components/shared/PageShell";
import { TagFilter } from "../../components/shared/TagFilter";

export const metadata = {
  title: "Video | Roberto Gianocca",
  description: "Video da Vimeo.",
};

/** Raccoglie tutti i tag unici dall'intero manifest, ordinati alfabeticamente. */
function collectAllTags(videos) {
  const set = new Set();
  for (const v of videos) {
    for (const tag of v.tags ?? []) {
      set.add(tag);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "it"));
}

export default async function VideoPage({ searchParams }) {
  const { tag } = await searchParams;
  const activeTag = typeof tag === "string" && tag.length > 0 ? tag : null;

  const allTags = collectAllTags(VIDEOS);

  const filtered =
    activeTag !== null
      ? VIDEOS.filter((v) => (v.tags ?? []).includes(activeTag))
      : VIDEOS;

  return (
    <PageShell
      header={
        <div className="space-y-2">
          <BackLink href="/" label="Torna al portfolio" />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Video</h1>
          <p className="max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
            Elenco in{" "}
            <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-xs dark:bg-zinc-800/80">src/data/videos.js</code>:{" "}
            <strong className="font-medium text-foreground">slug</strong>, titolo, descrizione breve,{" "}
            <strong className="font-medium text-foreground">vimeoId</strong> (solo cifre), opzionale{" "}
            <strong className="font-medium text-foreground">thumbnailUrl</strong> per la card.
          </p>
          <TagFilter basePath="/video" tags={allTags} activeTag={activeTag} />
        </div>
      }
    >
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300/80 bg-background p-8 text-zinc-600 dark:border-zinc-700/80 dark:text-zinc-400">
          <p className="font-medium text-foreground">
            {activeTag ? `Nessun video con il tag "${activeTag}"` : "Nessun video in elenco"}
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            {activeTag ? (
              <>
                Prova a selezionare un altro tag oppure{" "}
                <a
                  href="/video"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  mostra tutti i video
                </a>
                .
              </>
            ) : (
              <>
                Aggiungi voci in{" "}
                <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">src/data/videos.js</code> (slug,
                titolo, descrizione, id Vimeo).
              </>
            )}
          </p>
        </div>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2">
          {filtered.map((video) => (
            <li key={video.slug}>
              <VideoCard
                title={video.title}
                shortDescription={video.shortDescription}
                thumbnailUrl={video.thumbnailUrl}
                thumbnailAlt={`Anteprima: ${video.title}`}
                href={`/video/${video.slug}`}
              />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
