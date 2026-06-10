'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';

function PlayIcon() {
  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="28" cy="28" r="28" fill="white" fillOpacity="0.92" />
      <polygon points="22,17 42,28 22,39" fill="#18181b" />
    </svg>
  );
}

/**
 * Video in evidenza per la homepage.
 * Layout: [player a sinistra] [titolo + descrizione + CTA a destra].
 * Mostra thumbnail con pulsante play; al click sostituisce con iframe Vimeo (autoplay).
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
  const [playing, setPlaying] = useState(false);

  const iframeSrc = `https://player.vimeo.com/video/${vimeoId}?autoplay=1&dnt=1`;

  return (
    <div className="grid grid-cols-[3fr_2fr] gap-4">
      {/* Left: player */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 bg-black shadow-sm dark:border-zinc-800/90">
        <div className="relative aspect-video w-full">
          {playing ? (
            <iframe
              src={iframeSrc}
              title={title}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Riproduci ${title}`}
              className="group absolute inset-0 flex h-full w-full items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
            >
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl}
                  alt={thumbnailAlt}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-900" />
              )}
              <span className="relative z-10 transition-transform duration-200 group-hover:scale-110">
                <PlayIcon />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Right: text */}
      <div className="flex flex-col justify-center gap-3 py-1">
        <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
        <Link
          href={detailHref}
          className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-foreground hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {seeProjectLabel} →
        </Link>
      </div>
    </div>
  );
}
