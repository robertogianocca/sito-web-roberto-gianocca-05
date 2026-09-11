"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const LISTING_SCROLL_ROOT_SELECTOR = "main[data-video-listing]";

/**
 * @param {{
 *   videos: Array<{
 *     slug: string;
 *     title: string;
 *     subtitle?: string;
 *     thumbnailUrl?: string;
 *     thumbnailAlt: string;
 *   }>;
 *   activeSlug?: string | null;
 *   mode: "listing" | "detail";
 * }} props
 */
export function VideoFooterThumbnails({ videos, activeSlug: activeSlugProp = null, mode }) {
  const t = useTranslations("Video");
  const stripRef = useRef(null);
  const thumbRefs = useRef(new Map());
  /** Only the listing mode tracks its own active thumb; detail mode follows the route. */
  const [scrolledSlug, setScrolledSlug] = useState(videos[0]?.slug ?? null);
  const activeSlug = mode === "detail" ? activeSlugProp : scrolledSlug;

  const updateActiveFromScroll = useCallback(() => {
    const root = document.querySelector(LISTING_SCROLL_ROOT_SELECTOR);
    if (!root) return;

    const cards = root.querySelectorAll("[data-video-slug]");
    if (!cards.length) return;

    const rootCenter = root.scrollLeft + root.clientWidth / 2;
    let closestSlug = null;
    let minDistance = Infinity;

    for (const card of cards) {
      const slug = card.getAttribute("data-video-slug");
      if (!slug) continue;

      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - rootCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestSlug = slug;
      }
    }

    if (closestSlug) {
      setScrolledSlug(closestSlug);
    }
  }, []);

  useEffect(() => {
    if (mode !== "listing") return;

    const root = document.querySelector(LISTING_SCROLL_ROOT_SELECTOR);
    if (!root) return;

    // Read the restored scroll position after paint rather than during the effect.
    const rafId = requestAnimationFrame(updateActiveFromScroll);
    root.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    window.addEventListener("resize", updateActiveFromScroll);

    return () => {
      cancelAnimationFrame(rafId);
      root.removeEventListener("scroll", updateActiveFromScroll);
      window.removeEventListener("resize", updateActiveFromScroll);
    };
  }, [mode, updateActiveFromScroll, videos]);

  useEffect(() => {
    const thumb = activeSlug ? thumbRefs.current.get(activeSlug) : null;
    if (!thumb || !stripRef.current) return;

    thumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeSlug]);

  const scrollToCard = useCallback((slug) => {
    const card = document.querySelector(`[data-video-slug="${slug}"]`);
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setScrolledSlug(slug);
  }, []);

  if (videos.length === 0) {
    return null;
  }

  return (
    <div
      ref={stripRef}
      className="scrollbar-none hidden h-full items-start gap-4 overflow-x-auto overscroll-x-contain pt-3 pb-1 [-ms-overflow-style:none] md:flex [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label={t("filmstripLabel")}
    >
      {videos.map((video) => {
        const isActive = video.slug === activeSlug;

        const item = (
          <span className="flex w-35.5 flex-col gap-1.5">
            <span
              className={`relative block h-20 w-full shrink-0 overflow-hidden rounded-lg transition ${
                isActive
                  ? "opacity-100"
                  : "opacity-50 group-hover:opacity-85"
              }`}
            >
              {video.thumbnailUrl ? (
                <Image
                  src={video.thumbnailUrl}
                  alt=""
                  fill
                  sizes="142px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center bg-zinc-700/40 text-[0.65rem] font-medium text-white/80">
                  {video.title}
                </span>
              )}
            </span>
            <span className="min-w-0 text-left">
              <span
                className={`block truncate text-xs leading-tight ${
                  isActive
                    ? "font-semibold text-zinc-900"
                    : "font-medium text-zinc-800"
                }`}
              >
                {video.title}
              </span>
              {video.subtitle ? (
                <span
                  className={`mt-0.5 block text-[0.65rem] leading-tight ${
                    isActive ? "text-zinc-700" : "text-zinc-700/75"
                  } line-clamp-2 whitespace-normal`}
                >
                  {video.subtitle}
                </span>
              ) : null}
            </span>
          </span>
        );

        if (mode === "detail") {
          return (
            <Link
              key={video.slug}
              ref={(el) => {
                if (el) thumbRefs.current.set(video.slug, el);
                else thumbRefs.current.delete(video.slug);
              }}
              href={`/video/${video.slug}`}
              role="tab"
              aria-selected={isActive}
              aria-label={t("goToVideo", { title: video.title })}
              className="group shrink-0 rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-white"
            >
              {item}
            </Link>
          );
        }

        return (
          <button
            key={video.slug}
            ref={(el) => {
              if (el) thumbRefs.current.set(video.slug, el);
              else thumbRefs.current.delete(video.slug);
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={t("goToVideo", { title: video.title })}
            onClick={() => scrollToCard(video.slug)}
            className="group shrink-0 rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-white"
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
