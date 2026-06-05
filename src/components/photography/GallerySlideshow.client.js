"use client";

/**
 * Slideshow galleria photography: sidebar (titolo, testo, controlli, miniature) + pannello
 * immagine principale. Sotto-componenti per dissolvenza e transizione tra slide.
 */

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GalleryThumbnails } from "./GalleryThumbnails.client";
import { PhotographyRichDescription } from "./PhotographyRichDescription";

// ---------------------------------------------------------------------------
// Costanti (qualita, preload, dimensioni `sizes` Next/Image)
// ---------------------------------------------------------------------------
const MAIN_QUALITY = 70;
const REVEAL_DURATION_MS = 420;

const imageSizes = "(max-width: 1400px) 100vw, 70vw";

// Classi condivise slide principale (object-fit, anti-drag / anti-selezione)
/** Limita salvataggio da clic destro e trascinamento (mitigazione lato UI, non sicurezza). */
const galleryImageClass =
  "max-h-full max-w-full select-none object-contain [-webkit-user-drag:none]";

// ---------------------------------------------------------------------------
// Spinner overlay sulla slide principale (in attesa di `onLoad`)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Slide principale — dissolvenza in opacita su caricamento completato
// ---------------------------------------------------------------------------
/**
 * Spinner finche l'immagine non e pronta; poi dissolvenza leggera in opacita.
 */
function GalleryMainSlideImage({ src, alt, width, height, preload = true, onReady }) {
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
        preload={preload}
        quality={MAIN_QUALITY}
        onLoad={() => {
          setRevealed(true);
          onReady?.();
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slide principale — versione "stabile" (slide visibile durante la transizione)
// ---------------------------------------------------------------------------
/**
 * Slide gia mostrata: qualita fissa, niente ramp (evita flash in transizione).
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
      quality={MAIN_QUALITY}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

// ---------------------------------------------------------------------------
// GallerySlideshow — layout sidebar + area slide, stato e navigazione
// ---------------------------------------------------------------------------
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
  // --- Stato: indice richiesto vs indice effettivamente mostrato (transizione slide) ---
  const [index, setIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const total = slides.length;
  const safeIndex = total > 0 ? Math.min(index, total - 1) : 0;
  const displayedIdx = total > 0 ? Math.min(displayedIndex, total - 1) : 0;
  const current = slides[safeIndex] ?? null;
  const displayed = slides[displayedIdx] ?? null;
  const isTransitioning = total > 0 && safeIndex !== displayedIdx;

  // --- Allineamento indice mostrato quando la nuova immagine e pronta ---
  const handleIncomingReady = useCallback(() => {
    setDisplayedIndex(safeIndex);
  }, [safeIndex]);

  // --- Navigazione slide principale (frecce / tastiera) + scelta da miniature ---
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

  // --- Scorciatoie tastiera (<- / ->) ---
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

  // Nessuna slide valida (es. array vuoto lato parent)
  if (!current || total === 0 || !displayed) {
    return null;
  }

  // Indici adiacenti unici (prev + next) relativi alla slide visibile.
  // Deduplicati con Set: quando total === 2 prev e next coincidono.
  const adjacentIndices =
    total > 1
      ? [...new Set([(displayedIdx - 1 + total) % total, (displayedIdx + 1) % total])]
      : [];

  return (
    // --- Shell: colonna sidebar (sinistra) + area slide (destra) ---
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-50 md:flex-row md:overflow-hidden dark:bg-zinc-950">
      {/* ========== Sidebar ========== */}
      <aside className="flex w-full shrink-0 flex-col gap-4 border-zinc-200/80 bg-background p-4 md:h-full md:min-h-0 md:w-[min(100%,15rem)] md:border-r md:self-stretch dark:border-zinc-800/80 lg:w-64 lg:p-5">
        {/* Link torna all'indice photography */}
        <Link
          href={backHref}
          className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-foreground hover:underline dark:text-zinc-400"
        >
          ← Photography
        </Link>
        {/* Titolo galleria + didascalia (markdown) */}
        <div className="shrink-0 space-y-1.5">
          <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
            {title}
          </h1>
          <PhotographyRichDescription markdown={description} />
        </div>

        {/* Contatore slide (es. 3 / 12) + pulsanti Indietro / Avanti */}
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
              <span aria-hidden>&#8592;</span>
              <span className="hidden sm:inline">Indietro</span>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300/90 bg-background py-2.5 text-sm font-medium text-foreground transition hover:bg-zinc-100 dark:border-zinc-700/90 dark:hover:bg-zinc-900"
              aria-label="Immagine successiva"
            >
              <span className="hidden sm:inline">Avanti</span>
              <span aria-hidden>&#8594;</span>
            </button>
          </div>
        </div>

        {/* Griglia miniature + paginazione (ancorata in basso nella sidebar) */}
        <div className="mt-auto min-h-0 w-full shrink-0">
          <GalleryThumbnails slides={slides} currentIndex={safeIndex} onSelectIndex={selectIndex} />
        </div>
      </aside>

      {/* ========== Area slide principale (sfondo scuro) ========== */}
      <div
        className="relative flex min-h-[50vh] flex-1 flex-col bg-zinc-900 p-3 select-none md:min-h-0 md:p-4 lg:p-5"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Preload slide adiacenti (prev/next) via next/image — pipeline /_next/image corretto.
            Nascosto visivamente; loading eager + fetchPriority low per non competere con la slide attiva. */}
        {adjacentIndices.length > 0 ? (
          <div aria-hidden className="pointer-events-none absolute overflow-hidden opacity-0 w-px h-px">
            {adjacentIndices.map((i) => (
              <Image
                key={slides[i].publicId}
                src={slides[i].src}
                alt=""
                width={slides[i].width}
                height={slides[i].height}
                quality={MAIN_QUALITY}
                sizes={imageSizes}
                loading="eager"
                fetchPriority="low"
              />
            ))}
          </div>
        ) : null}

        <div className="relative flex min-h-0 w-full max-w-full flex-1 items-center justify-center">
          {isTransitioning ? (
            // --- Crossfade: slide corrente (stabile) + nuova in caricamento (invisibile fino a ready) ---
            <>
              {/* Spinner "caricamento prossima slide" (angolo) */}
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
              {/* Layer visibile: slide gia confermata */}
              <div className="absolute inset-0 z-1 flex items-center justify-center">
                <GalleryMainSlideImageStable
                  src={displayed.src}
                  alt={displayed.alt}
                  width={displayed.width}
                  height={displayed.height}
                />
              </div>
              {/* Layer preload: nuova slide (opacita 0, sblocca `onReady` -> aggiorna displayedIndex) */}
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
                  preload={false}
                  onReady={handleIncomingReady}
                />
              </div>
            </>
          ) : (
            // --- Nessuna transizione: una sola slide ---
            <GalleryMainSlideImage
              key={current.publicId}
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
            />
          )}
        </div>
      </div>
    </div>
  );
}
