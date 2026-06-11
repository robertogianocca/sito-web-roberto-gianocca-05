'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';

/**
 * Mosaico asimmetrico per la sezione Photography in homepage.
 *
 * Layout (griglia a 2 colonne, 2 righe):
 *   ┌─────────────────────┬──────────┐
 *   │                     │ slot B   │  ← statico, altra galleria
 *   │  slot A (carosello) ├──────────┤
 *   │                     │ slot C   │  ← statico, altra galleria
 *   ├─────────────────────┘          │  (col 2 si ferma alla riga 1)
 *   │  Titolo · Descrizione · CTA    │  ← riga 2, colonna 1 soltanto
 *   └────────────────────────────────┘
 *
 * Slot A: cicla `carouselImages` ogni 4s con crossfade fluido.
 *   - L'altezza del mosaico è determinata dalla proporzione di slot A (`imageAspect`).
 *   - Le immagini usano `object-cover` per riempire sempre il contenitore.
 * Testo (titolo, descrizione, CTA): riga 2, colonna 1 → stessa larghezza di slot A.
 * Slot B e C: riga 1, colonna 2, con `object-cover` decorativo.
 *
 * @param {{
 *   carouselImages: { src: string, alt: string }[];
 *   sideGalleries: { src: string | null, alt: string, href: string }[];
 *   title: string;
 *   description: string;
 *   detailHref: string;
 *   seeGalleryLabel: string;
 *   imageAspect?: string;
 * }} props
 */
export function HomePhotographyMosaic({
  carouselImages,
  sideGalleries,
  title,
  description,
  detailHref,
  seeGalleryLabel,
  imageAspect = '4/3',
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef(null);

  const hasCarousel = carouselImages.length > 1;

  // Advance to the next slide index every 4s.
  // Does NOT set transitioning here — React 18 batches both state updates into
  // one render, which would make the next image appear at opacity:1 immediately,
  // skipping the CSS transition and preventing onTransitionEnd from firing.
  useEffect(() => {
    if (!hasCarousel) return;

    timerRef.current = setInterval(() => {
      const next = (currentIdx + 1) % carouselImages.length;
      setNextIdx(next);
    }, 4000);

    return () => clearInterval(timerRef.current);
  }, [currentIdx, carouselImages.length, hasCarousel]);

  // Once nextIdx is set and the image has rendered at opacity:0, kick off the
  // fade. Double rAF guarantees the element is in the DOM before we change opacity.
  useEffect(() => {
    if (nextIdx === null) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransitioning(true));
    });
    return () => cancelAnimationFrame(id);
  }, [nextIdx]);

  function handleTransitionEnd() {
    if (nextIdx === null) return;
    setCurrentIdx(nextIdx);
    setNextIdx(null);
    setTransitioning(false);
  }

  const sideB = sideGalleries[0] ?? null;
  const sideC = sideGalleries[1] ?? null;

  return (
    <div className="grid grid-cols-[3fr_2fr] gap-x-2 gap-y-3">
      {/* Slot A — col 1, row 1: carousel, configurable aspect ratio */}
      <Link
        href={detailHref}
        className="relative block overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-900 dark:border-zinc-800/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        style={{ aspectRatio: imageAspect }}
      >
        {carouselImages.length === 0 ? (
          <div className="absolute inset-0 bg-zinc-800" />
        ) : (
          <>
            {/* Current image — always visible */}
            {carouselImages[currentIdx] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={carouselImages[currentIdx].src}
                alt={carouselImages[currentIdx].alt}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            )}
            {/* Next image — fades in over the current one */}
            {nextIdx !== null && carouselImages[nextIdx] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={carouselImages[nextIdx].src}
                alt={carouselImages[nextIdx].alt}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out"
                style={{ opacity: transitioning ? 1 : 0 }}
                onTransitionEnd={handleTransitionEnd}
                draggable={false}
              />
            )}
          </>
        )}
        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 hover:bg-black/10" />
      </Link>

      {/* Col 2, row 1: slots B and C stacked, same height as slot A */}
      <div className="flex flex-col gap-2">
        <SlotStatic gallery={sideB} />
        <SlotStatic gallery={sideC} />
      </div>

      {/* Col 1, row 2: text — constrained to slot A's width */}
      <div className="flex flex-col gap-1 px-0.5">
        <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground">
          {title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
        <Link
          href={detailHref}
          className="mt-0.5 text-xs font-medium text-zinc-500 underline-offset-2 hover:text-foreground hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {seeGalleryLabel} →
        </Link>
      </div>
    </div>
  );
}

function SlotStatic({ gallery }) {
  if (!gallery) {
    return (
      <div className="relative flex-1 min-h-0 rounded-lg border border-dashed border-zinc-300/80 bg-zinc-100 dark:border-zinc-700/80 dark:bg-zinc-900" />
    );
  }

  return (
    <Link
      href={gallery.href}
      className="relative flex-1 min-h-0 block overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-900 dark:border-zinc-800/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
    >
      {gallery.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gallery.src}
          alt={gallery.alt}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-800" />
      )}
      {/* Title overlay */}
      {gallery.alt && (
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6 pointer-events-none">
          <p className="truncate text-xs font-medium text-white">{gallery.alt}</p>
        </div>
      )}
    </Link>
  );
}
