import { Link } from '@/i18n/navigation';

/**
 * Card thumbnail compatta per la riga dei video in homepage.
 * Solo immagine + titolo + link alla pagina dettaglio.
 *
 * @param {{
 *   title: string;
 *   thumbnailUrl?: string;
 *   thumbnailAlt: string;
 *   href: string;
 * }} props
 */
export function HomeVideoThumb({ title, thumbnailUrl, thumbnailAlt, href }) {
  return (
    <Link
      href={href}
      className="group block rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
    >
      <div className="flex flex-col gap-1.5">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-100 dark:border-zinc-800/90 dark:bg-zinc-900">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt={thumbnailAlt}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-zinc-400 dark:text-zinc-600">Video</span>
            </div>
          )}
        </div>
        <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground group-hover:underline group-hover:underline-offset-2">
          {title}
        </p>
      </div>
    </Link>
  );
}
