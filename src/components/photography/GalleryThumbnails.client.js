"use client";

import Image from "next/image";
import { useMemo } from "react";

const ITEMS_PER_PAGE = 20;

/**
 * Griglia miniature (stesso approccio di immagina-website-03): stesso `src` della
 * slide principale; Next/Image ridimensiona con width/height piccoli.
 *
 * @param {{
 *   slides: Array<{ publicId: string; src: string }>;
 *   currentIndex: number;
 *   onSelectIndex: (index: number) => void;
 * }} props
 */
export function GalleryThumbnails({ slides, currentIndex, onSelectIndex }) {
  const total = slides.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const pageFromIndex = Math.floor(currentIndex / ITEMS_PER_PAGE) + 1;

  const pageSlice = useMemo(() => {
    const start = (pageFromIndex - 1) * ITEMS_PER_PAGE;
    return slides.slice(start, start + ITEMS_PER_PAGE);
  }, [slides, pageFromIndex]);

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex min-h-0 max-h-[260px] flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Galleria
      </p>
      <div className="grid min-h-0 grid-cols-5 gap-2 overflow-y-auto pr-1">
        {pageSlice.map((item, i) => {
          const globalIndex = (pageFromIndex - 1) * ITEMS_PER_PAGE + i;
          const active = globalIndex === currentIndex;
          return (
            <button
              key={item.publicId}
              type="button"
              onClick={() => onSelectIndex(globalIndex)}
              aria-label={`Vai alla foto ${globalIndex + 1}`}
              aria-current={active ? "true" : undefined}
              className={`relative aspect-square overflow-hidden rounded border transition ${
                active
                  ? "border-foreground ring-2 ring-foreground/25"
                  : "border-zinc-200/90 opacity-85 hover:opacity-100 dark:border-zinc-700/90"
              }`}
            >
              <Image
                src={item.src}
                alt=""
                width={64}
                height={64}
                sizes="64px"
                quality={30}
                loading="eager"
                className="h-full w-full object-cover"
              />
            </button>
          );
        })}
      </div>
      {totalPages > 1 ? (
        <div className="flex shrink-0 justify-center gap-1.5 pt-1">
          {Array.from({ length: totalPages }, (_, p) => (
            <button
              key={p}
              type="button"
              aria-label={`Vai alla pagina miniature ${p + 1} di ${totalPages}`}
              onClick={() => onSelectIndex(p * ITEMS_PER_PAGE)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                pageFromIndex === p + 1 ? "bg-zinc-700 dark:bg-zinc-300" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
