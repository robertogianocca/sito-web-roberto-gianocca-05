"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

const INTERVAL_MS = 4000;
const FADE_MS = 700;
const SETTLE_BUFFER_MS = 50;

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
 * Slot A: cicla `carouselImages` ogni 4s con crossfade a due layer opachi.
 *   - L'altezza del mosaico è determinata dalla proporzione di slot A (`imageAspect`).
 *   - Le immagini usano `object-contain` (letterbox scuro se le proporzioni non coincidono).
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
  imageAspect = "4/3",
}) {
  const hasCarousel = carouselImages.length > 1;

  /** Which layer (0 | 1) is the visible front (z-0, opacity 1). */
  const [front, setFront] = useState(0);
  /** Image currently shown in each layer. Back is pre-warmed with slide 1 when possible. */
  const [layerImages, setLayerImages] = useState(() => [
    carouselImages[0] ?? null,
    carouselImages[1] ?? carouselImages[0] ?? null,
  ]);
  /** Carousel index of the front image. */
  const [currentIdx, setCurrentIdx] = useState(0);
  /** Carousel index being faded in on the back layer, or null when idle. */
  const [pending, setPending] = useState(null);
  const [fading, setFading] = useState(false);

  const img0Ref = useRef(null);
  const img1Ref = useRef(null);
  const imgRefs = [img0Ref, img1Ref];

  // Warm the full carousel so later slides are not still decoding mid-fade.
  useEffect(() => {
    carouselImages.forEach((img) => {
      if (!img?.src) return;
      const preloader = new window.Image();
      preloader.src = img.src;
    });
  }, [carouselImages]);

  // Schedule next slide after INTERVAL_MS when idle.
  useEffect(() => {
    if (!hasCarousel || pending !== null) return;

    const id = setTimeout(() => {
      const next = (currentIdx + 1) % carouselImages.length;
      const back = 1 - front;
      setLayerImages((prev) => {
        const nextLayers = [...prev];
        nextLayers[back] = carouselImages[next];
        return nextLayers;
      });
      setPending(next);
    }, INTERVAL_MS);

    return () => clearTimeout(id);
  }, [front, currentIdx, pending, hasCarousel, carouselImages]);

  // When pending is set: wait until the back image is decoded, then fade in and settle.
  useEffect(() => {
    if (pending === null) return;

    const back = 1 - front;
    const img = imgRefs[back].current;
    let cancelled = false;
    let settleId = 0;

    async function startFade() {
      if (img) {
        try {
          await img.decode();
        } catch {
          // Rejected decode still means we should move on rather than stall.
        }
      }
      if (cancelled) return;

      setFading(true);
      settleId = setTimeout(() => {
        if (cancelled) return;
        setFront(back);
        setCurrentIdx(pending);
        setPending(null);
        setFading(false);
      }, FADE_MS + SETTLE_BUFFER_MS);
    }

    startFade();

    return () => {
      cancelled = true;
      clearTimeout(settleId);
    };
    // imgRefs is stable; pending/front drive the cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, front]);

  const sideB = sideGalleries[0] ?? null;
  const sideC = sideGalleries[1] ?? null;

  return (
    <div className="grid grid-cols-[3fr_2fr] gap-x-2 gap-y-3">
      {/* Slot A — col 1, row 1: carousel, configurable aspect ratio */}
      <Link
        href={detailHref}
        className="relative block overflow-hidden border border-zinc-200/90 bg-black dark:border-zinc-800/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        style={{ aspectRatio: imageAspect }}
      >
        {carouselImages.length === 0 ? (
          <div className="absolute inset-0 bg-zinc-800" />
        ) : (
          [0, 1].map((layer) => {
            const image = layerImages[layer];
            if (!image) return null;

            const isFront = layer === front;
            const isBack = !isFront;
            const opacity = isFront || fading ? 1 : 0;
            // Transition only on the back layer so idle opacity:0 and settle
            // opacity drops do not animate the wrong direction unexpectedly.
            // While pending && !fading the back already has the transition class
            // at opacity 0, so setFading(true) can animate 0 → 1 cleanly.
            const transitionClass =
              isBack && pending !== null
                ? "transition-opacity duration-700 ease-in-out motion-reduce:transition-none"
                : "";

            return (
              <div
                key={layer}
                className={`absolute inset-0 bg-black ${isFront ? "z-0" : "z-1"} ${transitionClass}`}
                style={{ opacity }}
                aria-hidden={!isFront}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRefs[layer]}
                  src={image.src}
                  alt={isFront ? image.alt : ""}
                  className="absolute inset-0 h-full w-full object-contain"
                  draggable={false}
                />
              </div>
            );
          })
        )}
        {/* Subtle hover overlay — above both carousel layers */}
        <div className="absolute inset-0 z-2 bg-black/0 transition-colors duration-300 hover:bg-black/10" />
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
      <div className="relative flex-1 min-h-0 border border-dashed border-zinc-300/80 bg-zinc-100 dark:border-zinc-700/80 dark:bg-zinc-900" />
    );
  }

  return (
    <Link
      href={gallery.href}
      className="relative flex-1 min-h-0 block overflow-hidden border border-zinc-200/90 bg-zinc-900 dark:border-zinc-800/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
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
