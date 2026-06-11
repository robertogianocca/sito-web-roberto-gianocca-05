import Image from "next/image";
import { Link } from "@/i18n/navigation";

/**
 * Card thumbnail compatta per la riga delle gallerie in homepage.
 * Immagine di copertina + titolo + link alla pagina galleria.
 *
 * @param {{
 *   title: string;
 *   coverSrc?: string | null;
 *   href: string;
 *   aspect?: string;
 * }} props
 */
export function HomeGalleryThumb({ title, coverSrc, href, aspect = '4/3' }) {
  return (
    <Link
      href={href}
      className="group block rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
    >
      <div className="flex flex-col gap-1.5">
        <div
          className="relative w-full overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-100 dark:border-zinc-800/90 dark:bg-zinc-900"
          style={{ aspectRatio: aspect }}
        >
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, 15vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-zinc-400 dark:text-zinc-600">Photo</span>
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
