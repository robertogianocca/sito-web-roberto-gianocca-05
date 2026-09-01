'use client';

import { HorizontalScrollContainer } from '@/components/home/HorizontalScrollContainer.client';

/**
 * Horizontal row of video cards with homepage-style wheel scroll on desktop.
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function VideoCardRow({ children }) {
  return (
    <HorizontalScrollContainer
      showScrollHints
      aria-label="Video projects"
      className="flex min-h-0 flex-1 flex-row flex-nowrap items-start gap-8 overflow-x-auto overflow-y-hidden overscroll-x-contain px-6 py-10 md:px-10 md:py-12"
    >
      {children}
    </HorizontalScrollContainer>
  );
}
