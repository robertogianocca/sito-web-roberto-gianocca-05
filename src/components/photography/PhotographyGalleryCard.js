import Image from "next/image";
import Link from "next/link";

/**
 * @param {{
 *   title: string;
 *   shortDescription: string;
 *   coverSrc: string | null;
 *   coverAlt: string;
 *   footnote?: string | null;
 *   href?: string;
 * }} props
 */
export function PhotographyGalleryCard({
  title,
  shortDescription,
  coverSrc,
  coverAlt,
  footnote,
  href,
}) {
  const inner = (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-background shadow-sm transition-[box-shadow,transform] dark:border-zinc-800/90">
      <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-900">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={coverAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Nessuna copertina disponibile
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {shortDescription}
        </p>
        {footnote ? (
          <p className="text-xs text-amber-700 dark:text-amber-400/90">{footnote}</p>
        ) : null}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block h-full rounded-xl outline-offset-2 focus-visible:outline-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
      >
        <div className="h-full group-hover:[&_article]:shadow-md group-hover:[&_article]:ring-1 group-hover:[&_article]:ring-zinc-300/80 dark:group-hover:[&_article]:ring-zinc-600/80">
          {inner}
        </div>
      </Link>
    );
  }

  return inner;
}
