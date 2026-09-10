"use client";

import { Link } from "@/i18n/navigation";
import { HomeCtaLink } from "@/components/home/HomeCtaLink";
import { VimeoPlayer } from "@/components/video/VimeoPlayer";

/**
 * Video in evidenza per la homepage.
 * Layout: [player a sinistra] [titolo + descrizione + CTA a destra].
 * Usa lo stesso player VidStack (chrome verde desktop) della pagina dettaglio.
 *
 * @param {{
 *   vimeoId: string;
 *   title: string;
 *   description: string;
 *   detailHref: string;
 *   seeProjectLabel: string;
 * }} props
 */
export function HomeFeaturedVideo({
  vimeoId,
  title,
  description,
  detailHref,
  seeProjectLabel,
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr] lg:items-start">
      <div className="min-w-0">
        <VimeoPlayer vimeoId={vimeoId} title={title} className="max-w-none" />
      </div>

      <div className="flex flex-col justify-start gap-3 self-start py-1">
        <h3 className="text-xl font-semibold leading-snug tracking-tight text-foreground md:text-2xl">
          <Link
            href={detailHref}
            className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
          >
            {title}
          </Link>
        </h3>
        {description ? (
          <p className="text-xs leading-relaxed text-zinc-600 md:text-sm dark:text-zinc-400">
            <Link
              href={detailHref}
              className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
            >
              {description}
            </Link>
          </p>
        ) : null}
        <HomeCtaLink href={detailHref} className="self-start">
          {seeProjectLabel} →
        </HomeCtaLink>
      </div>
    </div>
  );
}
