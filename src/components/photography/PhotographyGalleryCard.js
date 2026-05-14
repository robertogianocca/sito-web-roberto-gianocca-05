import Image from "next/image";
import Link from "next/link";
import { PhotographyRichDescription } from "./PhotographyRichDescription";

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
  const imageSection = (
    <div className="px-5 pt-5">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-sm bg-zinc-100 dark:bg-zinc-900">
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
    </div>
  );

  const titleBlock = (
    <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
  );

  const footnoteBlock = footnote ? (
    <p className="text-xs text-amber-700 dark:text-amber-400/90">{footnote}</p>
  ) : null;

  const articleClassName =
    "flex h-full flex-col overflow-hidden rounded-sm border border-zinc-200/90 bg-background shadow-sm transition-[box-shadow,transform] dark:border-zinc-800/90";

  if (href) {
    return (
      <div className="group block h-full rounded-sm outline-offset-2 focus-within:outline-2 focus-within:outline-zinc-400 dark:focus-within:outline-zinc-500">
        <article
          className={`${articleClassName} group-hover:shadow-md group-hover:ring-1 group-hover:ring-zinc-300/80 dark:group-hover:ring-zinc-600/80`}
        >
          <Link
            href={href}
            className="block shrink-0 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
          >
            {imageSection}
            <div className="px-5 pt-5">{titleBlock}</div>
          </Link>
          <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-2">
            <PhotographyRichDescription markdown={shortDescription} />
            {footnoteBlock}
          </div>
        </article>
      </div>
    );
  }

  return (
    <article className={articleClassName}>
      {imageSection}
      <div className="px-5 pt-5">{titleBlock}</div>
      <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-2">
        <PhotographyRichDescription markdown={shortDescription} />
        {footnoteBlock}
      </div>
    </article>
  );
}
