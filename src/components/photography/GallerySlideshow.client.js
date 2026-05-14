"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GalleryThumbnails } from "./GalleryThumbnails.client";

const MAIN_QUALITY_INITIAL = 1;
const MAIN_QUALITY_LOADED = 70;

/**
 * Immagina-style: quality bassa al mount, poi 70 dopo load. `key` sul parent
 * resetta lo stato a ogni slide senza useEffect (compatibile con lint React 19).
 */
function GalleryMainSlideImage({ src, alt, width, height }) {
  const [quality, setQuality] = useState(MAIN_QUALITY_INITIAL);
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="max-h-full max-w-full object-contain"
      sizes="(max-width: 1400px) 100vw, 70vw"
      priority
      quality={quality}
      onLoad={() => setQuality(MAIN_QUALITY_LOADED)}
    />
  );
}

/**
 * @param {{
 *   title: string;
 *   description: string;
 *   slides: Array<{
 *     src: string;
 *     alt: string;
 *     publicId: string;
 *     width: number;
 *     height: number;
 *   }>;
 *   backHref: string;
 * }} props
 */
export function GallerySlideshow({ title, description, slides, backHref }) {
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const safeIndex = total > 0 ? Math.min(index, total - 1) : 0;
  const current = slides[safeIndex] ?? null;

  const goPrev = useCallback(() => {
    setIndex((i) => (total <= 0 ? 0 : (i - 1 + total) % total));
  }, [total]);

  const goNext = useCallback(() => {
    setIndex((i) => (total <= 0 ? 0 : (i + 1) % total));
  }, [total]);

  const selectIndex = useCallback((i) => {
    setIndex(Math.max(0, Math.min(i, total - 1)));
  }, [total]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  if (!current || total === 0) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-50 md:flex-row md:overflow-hidden dark:bg-zinc-950">
      <aside className="flex w-full shrink-0 flex-col gap-6 border-zinc-200/80 bg-background p-6 md:w-[min(100%,22rem)] md:border-r dark:border-zinc-800/80 lg:w-96 lg:p-8">
        <Link
          href={backHref}
          className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-foreground hover:underline dark:text-zinc-400"
        >
          ← Photography
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>

        <GalleryThumbnails slides={slides} currentIndex={safeIndex} onSelectIndex={selectIndex} />

        <div className="mt-auto flex flex-col gap-4 border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {safeIndex + 1} / {total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300/90 bg-background py-3 text-sm font-medium text-foreground transition hover:bg-zinc-100 dark:border-zinc-700/90 dark:hover:bg-zinc-900"
              aria-label="Immagine precedente"
            >
              <span aria-hidden>←</span>
              <span className="hidden sm:inline">Indietro</span>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300/90 bg-background py-3 text-sm font-medium text-foreground transition hover:bg-zinc-100 dark:border-zinc-700/90 dark:hover:bg-zinc-900"
              aria-label="Immagine successiva"
            >
              <span className="hidden sm:inline">Avanti</span>
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="relative flex min-h-[50vh] flex-1 items-center justify-center bg-zinc-900 p-3 md:min-h-0 md:p-4">
        <div className="relative flex h-[min(70vh,900px)] w-full max-w-full items-center justify-center md:absolute md:inset-0 md:h-full md:min-h-[320px]">
          <GalleryMainSlideImage
            key={current.publicId}
            src={current.src}
            alt={current.alt}
            width={current.width}
            height={current.height}
          />
        </div>
      </div>
    </div>
  );
}
