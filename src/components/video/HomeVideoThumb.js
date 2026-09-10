import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { PhotographyRichDescription } from "@/components/photography/PhotographyRichDescription";

/**
 * Card thumbnail compatta per la riga dei video in homepage.
 * Immagine + titolo + sottotitolo + link alla pagina dettaglio.
 *
 * @param {{
 *   title: string;
 *   subtitle?: string;
 *   thumbnailUrl?: string;
 *   thumbnailAlt: string;
 *   href: string;
 * }} props
 */
export function HomeVideoThumb({ title, subtitle, thumbnailUrl, thumbnailAlt, href }) {
  return (
    <Link
      href={href}
      className="group block rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
    >
      <div className="flex flex-col gap-1.5">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-900">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={thumbnailAlt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, 15vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-zinc-400 dark:text-zinc-600">Video</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground group-hover:underline group-hover:underline-offset-2">
            {title}
          </p>
          {subtitle ? (
            <PhotographyRichDescription
              markdown={subtitle}
              className="mt-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400"
              paragraphClassName="line-clamp-1 text-xs"
            />
          ) : null}
        </div>
      </div>
    </Link>
  );
}
