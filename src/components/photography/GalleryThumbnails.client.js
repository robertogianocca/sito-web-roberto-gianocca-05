"use client";

import Image from "next/image";
import { useMemo } from "react";

const ITEMS_PER_PAGE = 20;

/**
 * Single thumbnail button. Isolated so the React Compiler can memoize each item
 * independently — only the previously-active and newly-active thumbnails re-render
 * on index change instead of the entire grid.
 */
function ThumbnailItem({ slide, globalIndex, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(globalIndex)}
      aria-label={`Vai alla foto ${globalIndex + 1}`}
      aria-current={isActive ? "true" : undefined}
      className={`relative aspect-square overflow-hidden rounded border transition ${
        isActive
          ? "border-foreground ring-2 ring-foreground/25"
          : "border-zinc-200/90 opacity-85 hover:opacity-100 dark:border-zinc-700/90"
      }`}
    >
      <Image
        src={slide.src}
        alt=""
        width={30}
        height={30}
        draggable={false}
        sizes="30px"
        quality={30}
        className="pointer-events-none h-full w-full object-cover select-none [-webkit-user-drag:none]"
      />
    </button>
  );
}

/**
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
    <div
      className="flex w-full flex-col gap-2 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="grid grid-cols-5 gap-1.5 overflow-hidden">
        {pageSlice.map((slide, i) => {
          const globalIndex = (pageFromIndex - 1) * ITEMS_PER_PAGE + i;
          return (
            <ThumbnailItem
              key={slide.publicId}
              slide={slide}
              globalIndex={globalIndex}
              isActive={globalIndex === currentIndex}
              onSelect={onSelectIndex}
            />
          );
        })}
      </div>
      {totalPages > 1 ? (
        <div
          className="flex shrink-0 flex-wrap justify-center gap-1.5 pt-1.5"
          role="tablist"
          aria-label="Pagine miniature"
        >
          {Array.from({ length: totalPages }, (_, i) => {
            const n = i + 1;
            const active = pageFromIndex === n;
            return (
              <button
                key={n}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Vai alla pagina miniature ${n} di ${totalPages}`}
                onClick={() => onSelectIndex((n - 1) * ITEMS_PER_PAGE)}
                className={`flex min-h-10 min-w-10 items-center justify-center rounded-md border text-sm font-medium transition ${
                  active
                    ? "border-foreground bg-foreground/10 text-foreground ring-2 ring-foreground/20"
                    : "border-zinc-300/90 bg-zinc-50 text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-500"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
