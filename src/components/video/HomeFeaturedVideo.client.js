"use client";

import { Link } from "@/i18n/navigation";
import { HomeCtaLink } from "@/components/home/HomeCtaLink";
import { VimeoPlayer } from "@/components/video/VimeoPlayer";
import { PhotographyRichDescription } from "@/components/photography/PhotographyRichDescription";

/**
 * Video in evidenza per la homepage.
 * Stesso VimeoPlayer del dettaglio: poster Cloudinary, solo play verde finché
 * non parte la riproduzione (`load="play"` evita il poster Vimeo).
 *
 * @param {{
 *   vimeoId: string;
 *   title: string;
 *   description: string;
 *   thumbnailUrl?: string;
 *   thumbnailAlt: string;
 *   detailHref: string;
 *   seeProjectLabel: string;
 * }} props
 */
export function HomeFeaturedVideo({
  vimeoId,
  title,
  description,
  thumbnailUrl,
  thumbnailAlt,
  detailHref,
  seeProjectLabel,
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr] lg:items-start">
      <div className="min-w-0">
        <VimeoPlayer
          vimeoId={vimeoId}
          title={title}
          poster={thumbnailUrl}
          posterAlt={thumbnailAlt}
          load="play"
          idlePlayOnly
          className="max-w-none"
        />
      </div>

      <div className="flex flex-col justify-start gap-4 self-start py-1">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold leading-snug tracking-tight text-foreground md:text-2xl">
            <Link
              href={detailHref}
              className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
            >
              {title}
            </Link>
          </h3>
          {description ? (
            <Link
              href={detailHref}
              className="block underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
            >
              <PhotographyRichDescription
                markdown={description}
                className="text-xs leading-relaxed text-zinc-600 md:text-sm dark:text-zinc-400"
                paragraphClassName="text-xs md:text-sm"
              />
            </Link>
          ) : null}
        </div>
        <HomeCtaLink href={detailHref} showArrow className="self-start">
          {seeProjectLabel}
        </HomeCtaLink>
      </div>
    </div>
  );
}
