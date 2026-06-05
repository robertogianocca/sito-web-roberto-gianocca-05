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
 *   coverPreload?: boolean;
 * }} props
 */
export function PhotographyGalleryCard({
  title,
  shortDescription,
  coverSrc,
  coverAlt,
  footnote,
  href,
  coverPreload = false,
}) {
  // The image+title block is wrapped in a Link when href is provided.
  // The description is intentionally outside the Link to avoid nesting <a> inside <a>
  // (PhotographyRichDescription can render markdown links).
  const header = href ? (
    <Link
      href={href}
      className="block shrink-0 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
    >
      <CoverImage src={coverSrc} alt={coverAlt} preload={coverPreload} />
      <div className="px-5 pt-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      </div>
    </Link>
  ) : (
    <>
      <CoverImage src={coverSrc} alt={coverAlt} preload={false} />
      <div className="px-5 pt-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      </div>
    </>
  );

  const article = (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-sm border border-zinc-200/90 bg-background shadow-sm transition-[box-shadow,transform] dark:border-zinc-800/90${
        href
          ? " group-hover:shadow-md group-hover:ring-1 group-hover:ring-zinc-300/80 dark:group-hover:ring-zinc-600/80"
          : ""
      }`}
    >
      {header}
      <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-2">
        <PhotographyRichDescription markdown={shortDescription} />
        {footnote ? (
          <p className="text-xs text-amber-700 dark:text-amber-400/90">{footnote}</p>
        ) : null}
      </div>
    </article>
  );

  if (href) {
    return (
      <div className="group block h-full rounded-sm outline-offset-2 focus-within:outline-2 focus-within:outline-zinc-400 dark:focus-within:outline-zinc-500">
        {article}
      </div>
    );
  }

  return article;
}

function CoverImage({ src, alt, preload }) {
  return (
    <div className="px-5 pt-5">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-sm bg-zinc-100 dark:bg-zinc-900">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
            preload={preload}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Nessuna copertina disponibile
          </div>
        )}
      </div>
    </div>
  );
}
