"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const LISTING_SCROLL_ROOT_SELECTOR = 'main[aria-label="Video projects"]';

/**
 * @param {{
 *   videos: Array<{ slug: string; title: string; thumbnailUrl?: string; thumbnailAlt: string }>;
 *   activeSlug?: string | null;
 *   mode: "listing" | "detail";
 * }} props
 */
export function VideoFooterThumbnails({ videos, activeSlug: activeSlugProp = null, mode }) {
  const t = useTranslations("Video");
  const stripRef = useRef(null);
  const thumbRefs = useRef(new Map());
  const [activeSlug, setActiveSlug] = useState(activeSlugProp ?? videos[0]?.slug ?? null);

  useEffect(() => {
    if (mode === "detail") {
      setActiveSlug(activeSlugProp);
    }
  }, [mode, activeSlugProp]);

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
      setActiveSlug(closestSlug);
    }
  }, []);

  useEffect(() => {
    if (mode !== "listing") return;

    const root = document.querySelector(LISTING_SCROLL_ROOT_SELECTOR);
    if (!root) return;

    updateActiveFromScroll();
    root.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    window.addEventListener("resize", updateActiveFromScroll);

    return () => {
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
    setActiveSlug(slug);
  }, []);

  if (videos.length === 0) {
    return null;
  }

  return (
    <div
      ref={stripRef}
      className="scrollbar-none flex h-full items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label={t("filmstripLabel")}
    >
      {videos.map((video) => {
        const isActive = video.slug === activeSlug;

        const thumb = (
          <span
            className={`relative block h-16 shrink-0 overflow-hidden rounded border transition ${
              isActive
                ? "border-white ring-2 ring-white/60"
                : "border-white/35 opacity-80 hover:border-white/60 hover:opacity-100"
            }`}
            style={{ aspectRatio: "16 / 9" }}
          >
            {video.thumbnailUrl ? (
              <Image
                src={video.thumbnailUrl}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center bg-zinc-700/40 text-[0.65rem] font-medium text-white/80">
                {video.title}
              </span>
            )}
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
              className="shrink-0 rounded outline-offset-2 focus-visible:outline-2 focus-visible:outline-white"
            >
              {thumb}
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
            className="shrink-0 rounded outline-offset-2 focus-visible:outline-2 focus-visible:outline-white"
          >
            {thumb}
          </button>
        );
      })}
    </div>
  );
}
