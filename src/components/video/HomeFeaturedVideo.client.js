"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { HomeCtaLink } from "@/components/home/HomeCtaLink";

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
 *   playLabel: string;
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
  playLabel,
}) {
  const [playing, setPlaying] = useState(false);

  const iframeSrc = `https://player.vimeo.com/video/${vimeoId}?autoplay=1&dnt=1`;

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr] lg:items-start">
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
              aria-label={playLabel}
              className="group absolute inset-0 flex h-full w-full items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
            >
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt={thumbnailAlt}
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 1023px) 100vw, 40vw"
                  loading="eager"
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

      {/* Right: text — top-aligned, larger title under section h2 */}
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
