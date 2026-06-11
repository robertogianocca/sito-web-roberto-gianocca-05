import { resolveLocalized } from "@/lib/i18n-content";

/** Placeholder ~2 righe a `max-w-prose`; sostituire con copy reale per sezione. */
const LOREM_TWO_LINES = {
  it: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
};

/**
 * Homepage section copy (area teasers). Edit here — not in messages/*.json.
 * `shortDescription`: shown beside the section title in the header.
 * `description`: reserved for longer copy (future use).
 *
 * @type {Record<string, {
 *   shortDescription?: string | { it: string, en: string },
 *   description?: string | { it: string, en: string }
 * }>}
 */
export const HOME_SECTIONS = {
  intro: {
    shortDescription: LOREM_TWO_LINES,
  },
  photography: {
    shortDescription: LOREM_TWO_LINES,
  },
  video: {
    shortDescription: LOREM_TWO_LINES,
  },
  graphicDesign: {
    shortDescription: LOREM_TWO_LINES,
  },
  blog: {
    shortDescription: LOREM_TWO_LINES,
  },
  contact: {
    shortDescription: LOREM_TWO_LINES,
  },
};

/**
 * @param {keyof typeof HOME_SECTIONS | string} sectionId
 * @param {string} locale
 * @returns {{ shortDescription: string, description: string }}
 */
export function getHomeSectionCopy(sectionId, locale) {
  const section = HOME_SECTIONS[sectionId];
  if (!section) {
    return { shortDescription: "", description: "" };
  }
  return {
    shortDescription: resolveLocalized(section.shortDescription, locale),
    description: resolveLocalized(section.description, locale),
  };
}
