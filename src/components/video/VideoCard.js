import Image from "next/image";
import Link from "next/link";

/**
 * @param {{
 *   title: string;
 *   shortDescription: string;
 *   thumbnailUrl?: string;
 *   thumbnailAlt: string;
 *   footnote?: string | null;
 *   href?: string;
 * }} props
 */
export function VideoCard({
  title,
  shortDescription,
  thumbnailUrl,
  thumbnailAlt,
  footnote,
  href,
}) {
  const article = (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-background shadow-sm transition-[box-shadow,transform] dark:border-zinc-800/90${
        href
          ? " group-hover:shadow-md group-hover:ring-1 group-hover:ring-zinc-300/80 dark:group-hover:ring-zinc-600/80"
          : ""
      }`}
    >
      <div className="relative aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-900">
        {thumbnailUrl ? (
          // Hostname must be listed in next.config.mjs remotePatterns.
          // Currently allows i.vimeocdn.com — add other providers there as needed.
          <Image
            src={thumbnailUrl}
            alt={thumbnailAlt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <span>Nessuna anteprima</span>
            <span className="text-xs leading-relaxed opacity-90">
              Opzionale: imposta <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-[0.65rem] dark:bg-zinc-800/80">thumbnailUrl</code> in{" "}
              <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-[0.65rem] dark:bg-zinc-800/80">src/data/videos.js</code>
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{shortDescription}</p>
        {footnote ? <p className="text-xs text-amber-700 dark:text-amber-400/90">{footnote}</p> : null}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block h-full rounded-xl outline-offset-2 focus-visible:outline-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
      >
        {article}
      </Link>
    );
  }

  return article;
}
