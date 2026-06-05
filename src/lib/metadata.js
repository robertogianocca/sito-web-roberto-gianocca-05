/**
 * Builds the `alternates.languages` object for Next.js metadata.
 * Produces hreflang entries for each locale and an x-default pointing to the default locale.
 *
 * @param {string} canonicalPath - The path without locale prefix, e.g. "/" or "/blog/my-post"
 * @param {{ locales: string[], defaultLocale: string }} routing
 * @returns {{ languages: Record<string, string> }}
 */
export function buildAlternates(canonicalPath, routing) {
  const { locales, defaultLocale } = routing;
  const languages = {};

  for (const locale of locales) {
    languages[locale] = `/${locale}${canonicalPath === "/" ? "" : canonicalPath}`;
  }

  languages["x-default"] = `/${defaultLocale}${canonicalPath === "/" ? "" : canonicalPath}`;

  return { languages };
}
