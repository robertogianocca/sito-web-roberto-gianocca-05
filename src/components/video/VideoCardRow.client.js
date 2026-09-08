"use client";

import { useTranslations } from "next-intl";
import { HorizontalScrollContainer } from "@/components/home/HorizontalScrollContainer.client";

/**
 * Horizontal row of video cards with homepage-style wheel scroll on desktop.
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function VideoCardRow({ children }) {
  const t = useTranslations("Video");

  return (
    <HorizontalScrollContainer
      showScrollHints
      aria-label={t("projectsAriaLabel")}
      // VideoFooterThumbnails finds this element to follow the scrolled card.
      // The hook must not key off aria-label: that string is translated.
      data-video-listing=""
      className="flex flex-col items-stretch gap-8 overflow-visible px-6 py-10 md:min-h-0 md:flex-1 md:flex-row md:flex-nowrap md:items-start md:overflow-x-auto md:overflow-y-hidden md:overscroll-x-contain md:px-10 md:py-12"
    >
      {children}
    </HorizontalScrollContainer>
  );
}
