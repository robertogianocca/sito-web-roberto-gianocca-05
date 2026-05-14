import Link from "next/link";
import { VIDEOS } from "../../data/videos";
import { VideoCard } from "../../components/video/VideoCard";

export const metadata = {
  title: "Video | Roberto Gianocca",
  description: "Video da Vimeo.",
};

export default function VideoPage() {
  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200/80 bg-background/80 px-6 py-6 backdrop-blur dark:border-zinc-800/80 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-foreground hover:underline dark:text-zinc-400"
            >
              ← Torna al portfolio
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Video</h1>
            <p className="max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
              Elenco in{" "}
              <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-xs dark:bg-zinc-800/80">src/data/videos.js</code>:{" "}
              <strong className="font-medium text-foreground">slug</strong>, titolo, descrizione breve,{" "}
              <strong className="font-medium text-foreground">vimeoId</strong> (solo cifre), opzionale{" "}
              <strong className="font-medium text-foreground">thumbnailUrl</strong> per la card.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-12">
        {VIDEOS.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300/80 bg-background p-8 text-zinc-600 dark:border-zinc-700/80 dark:text-zinc-400">
            <p className="font-medium text-foreground">Nessun video in elenco</p>
            <p className="mt-2 text-sm leading-relaxed">
              Aggiungi voci in{" "}
              <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">src/data/videos.js</code> (slug,
              titolo, descrizione, id Vimeo).
            </p>
          </div>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2">
            {VIDEOS.map((video) => (
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
      </main>
    </div>
  );
}
