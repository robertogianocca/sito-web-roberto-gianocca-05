"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const PRELOAD_ATTR = "data-photography-slide-preload";

/**
 * @param {{
 *   title: string;
 *   description: string;
 *   slides: Array<{ src: string; thumbSrc: string; alt: string; publicId: string }>;
 *   backHref: string;
 * }} props
 */
export function GallerySlideshow({ title, description, slides, backHref }) {
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const safeIndex = total > 0 ? Math.min(index, total - 1) : 0;
  const current = slides[safeIndex] ?? null;

  const prevSrc = useMemo(() => {
    if (total < 2) return null;
    return slides[(safeIndex - 1 + total) % total]?.src ?? null;
  }, [slides, safeIndex, total]);

  const nextSrc = useMemo(() => {
    if (total < 2) return null;
    return slides[(safeIndex + 1) % total]?.src ?? null;
  }, [slides, safeIndex, total]);

  const next2Src = useMemo(() => {
    if (total < 3) return null;
    return slides[(safeIndex + 2) % total]?.src ?? null;
  }, [slides, safeIndex, total]);

  useEffect(() => {
    const hrefs = [prevSrc, nextSrc, next2Src].filter(Boolean);
    const links = hrefs.map((href) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      link.setAttribute(PRELOAD_ATTR, "1");
      document.head.appendChild(link);
      return link;
    });
    return () => {
      links.forEach((el) => el.remove());
    };
  }, [prevSrc, nextSrc, next2Src]);

  const goPrev = useCallback(() => {
    setIndex((i) => (total <= 0 ? 0 : (i - 1 + total) % total));
  }, [total]);

  const goNext = useCallback(() => {
    setIndex((i) => (total <= 0 ? 0 : (i + 1) % total));
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
      <aside className="flex w-full shrink-0 flex-col gap-6 border-zinc-200/80 bg-background p-6 md:w-[min(100%,20rem)] md:border-r dark:border-zinc-800/80 lg:w-96 lg:p-8">
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

      <div className="relative flex min-h-[50vh] flex-1 bg-zinc-900 md:min-h-0">
        <div className="relative h-[min(70vh,900px)] w-full md:absolute md:inset-0 md:h-full md:min-h-[320px]">
          <Image
            src={current.src}
            alt={current.alt}
            fill
            className="object-contain"
            sizes="(min-width: 768px) 75vw, 100vw"
            priority={safeIndex === 0}
            key={current.publicId}
          />
        </div>
      </div>
    </div>
  );
}
