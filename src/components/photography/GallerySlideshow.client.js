"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GalleryThumbnails } from "./GalleryThumbnails.client";

const MAIN_QUALITY_INITIAL = 1;
const MAIN_QUALITY_LOADED = 70;
const PRELOAD_ATTR = "data-photography-adjacent-preload";
const REVEAL_DURATION_MS = 420;

const imageSizes = "(max-width: 1400px) 100vw, 70vw";

/** Limita salvataggio da clic destro e trascinamento (mitigazione lato UI, non sicurezza). */
const galleryImageClass =
  "max-h-full max-w-full select-none object-contain [-webkit-user-drag:none]";

function SlideLoadingSpinner({ className = "" }) {
  return (
    <div
      className={`pointer-events-none flex items-center justify-center ${className}`}
      aria-hidden
    >
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white" />
    </div>
  );
}

/**
 * Qualità bassa al mount (`quality` 1), poi 70 dopo `onLoadingComplete` (stile Immagina).
 * Spinner finché l’immagine non è pronta; poi dissolvenza leggera in opacità.
 */
function GalleryMainSlideImage({ src, alt, width, height, priority = true, onReady }) {
  const [quality, setQuality] = useState(MAIN_QUALITY_INITIAL);
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className="relative flex h-full w-full max-h-full max-w-full items-center justify-center"
      onContextMenu={(e) => e.preventDefault()}
    >
      {!revealed ? (
        <>
          <SlideLoadingSpinner className="absolute inset-0 z-10" />
          <span className="sr-only">Caricamento immagine</span>
        </>
      ) : null}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        draggable={false}
        className={`${galleryImageClass} transition-opacity ease-out ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDuration: `${REVEAL_DURATION_MS}ms` }}
        sizes={imageSizes}
        priority={priority}
        quality={quality}
        onLoadingComplete={() => {
          setQuality(MAIN_QUALITY_LOADED);
          setRevealed(true);
          onReady?.();
        }}
      />
    </div>
  );
}

/**
 * Slide già mostrata: qualità alta fissa, niente rampa (evita flash in transizione).
 */
function GalleryMainSlideImageStable({ src, alt, width, height }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      draggable={false}
      className={galleryImageClass}
      sizes={imageSizes}
      priority={false}
      quality={MAIN_QUALITY_LOADED}
      onContextMenu={(e) => e.preventDefault()}
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
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const total = slides.length;
  const safeIndex = total > 0 ? Math.min(index, total - 1) : 0;
  const displayedIdx = total > 0 ? Math.min(displayedIndex, total - 1) : 0;
  const current = slides[safeIndex] ?? null;
  const displayed = slides[displayedIdx] ?? null;
  const isTransitioning = total > 0 && safeIndex !== displayedIdx;

  const handleIncomingReady = useCallback(() => {
    setDisplayedIndex(safeIndex);
  }, [safeIndex]);

  const goPrev = useCallback(() => {
    setIndex((i) => (total <= 0 ? 0 : (i - 1 + total) % total));
  }, [total]);

  const goNext = useCallback(() => {
    setIndex((i) => (total <= 0 ? 0 : (i + 1) % total));
  }, [total]);

  const selectIndex = useCallback(
    (i) => {
      setIndex(Math.max(0, Math.min(i, total - 1)));
    },
    [total],
  );

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

  /** Preload soft prev/next (URL Cloudinary) in idle. */
  useEffect(() => {
    if (total < 2 || slides.length === 0) {
      return undefined;
    }

    const created = [];

    const run = () => {
      const prevHref = slides[(displayedIdx - 1 + total) % total]?.src;
      const nextHref = slides[(displayedIdx + 1) % total]?.src;
      const hrefs = [...new Set([prevHref, nextHref].filter(Boolean))];
      hrefs.forEach((href) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = href;
        link.setAttribute(PRELOAD_ATTR, "1");
        document.head.appendChild(link);
        created.push(link);
      });
    };

    let idleId;
    const useIdle = typeof window.requestIdleCallback === "function";
    if (useIdle) {
      idleId = window.requestIdleCallback(run, { timeout: 1200 });
    } else {
      idleId = setTimeout(run, 300);
    }

    return () => {
      if (useIdle) {
        window.cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId);
      }
      created.forEach((el) => el.remove());
    };
  }, [displayedIdx, slides, total]);

  if (!current || total === 0 || !displayed) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-50 md:flex-row md:overflow-hidden dark:bg-zinc-950">
      <aside className="flex w-full shrink-0 flex-col gap-4 border-zinc-200/80 bg-background p-4 md:h-full md:min-h-0 md:w-[min(100%,15rem)] md:border-r md:self-stretch dark:border-zinc-800/80 lg:w-64 lg:p-5">
        <Link
          href={backHref}
          className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-foreground hover:underline dark:text-zinc-400"
        >
          ← Photography
        </Link>
        <div className="shrink-0 space-y-1.5">
          <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {safeIndex + 1} / {total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300/90 bg-background py-2.5 text-sm font-medium text-foreground transition hover:bg-zinc-100 dark:border-zinc-700/90 dark:hover:bg-zinc-900"
              aria-label="Immagine precedente"
            >
              <span aria-hidden>←</span>
              <span className="hidden sm:inline">Indietro</span>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300/90 bg-background py-2.5 text-sm font-medium text-foreground transition hover:bg-zinc-100 dark:border-zinc-700/90 dark:hover:bg-zinc-900"
              aria-label="Immagine successiva"
            >
              <span className="hidden sm:inline">Avanti</span>
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>

        <div className="mt-auto min-h-0 w-full shrink-0">
          <GalleryThumbnails slides={slides} currentIndex={safeIndex} onSelectIndex={selectIndex} />
        </div>
      </aside>

      <div
        className="relative flex min-h-[50vh] flex-1 flex-col bg-zinc-900 p-3 select-none md:min-h-0 md:p-4 lg:p-5"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="relative flex min-h-0 w-full max-w-full flex-1 items-center justify-center">
          {isTransitioning ? (
            <>
              <div
                className="pointer-events-none absolute bottom-4 right-4 z-3 flex items-center justify-center rounded-full bg-black/35 p-2.5 backdrop-blur-sm md:bottom-5 md:right-5"
                role="status"
                aria-live="polite"
              >
                <span className="sr-only">Caricamento immagine successiva</span>
                <div
                  className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden
                />
              </div>
              <div className="absolute inset-0 z-1 flex items-center justify-center">
                <GalleryMainSlideImageStable
                  src={displayed.src}
                  alt={displayed.alt}
                  width={displayed.width}
                  height={displayed.height}
                />
              </div>
              <div
                className="pointer-events-none absolute inset-0 z-2 flex items-center justify-center opacity-0"
                aria-hidden
              >
                <GalleryMainSlideImage
                  key={current.publicId}
                  src={current.src}
                  alt={current.alt}
                  width={current.width}
                  height={current.height}
                  priority={false}
                  onReady={handleIncomingReady}
                />
              </div>
            </>
          ) : (
            <GalleryMainSlideImage
              key={current.publicId}
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              priority
            />
          )}
        </div>
      </div>
    </div>
  );
}
