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
    // Body text for the first "intro" panel on the homepage.
    // (We intentionally don't provide a `shortDescription` for this section.)
    description: {
      it: "Benvenuti! Sono un creativo con base in Ticino.\nScorrendo liberamente la pagina potete farvi un'idea generale della mia attività.\nSe invece volete accedere ad una sezione specifica usate il menu sottostante.\nBuona esplorazione!",
      en: "Welcome! I’m a creative based in Ticino.\nBy freely scrolling through the page you can get a general idea of my work.\nIf instead you'd like to jump to a specific section, use the menu below.\nEnjoy exploring!",
    },
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
