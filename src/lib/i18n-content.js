/**
 * Resolve a string or `{ it, en }` object to the active locale.
 * @param {string | Record<string, string> | undefined} value
 * @param {string} locale
 * @returns {string}
 */
export function resolveLocalized(value, locale) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] ?? value.en ?? "";
}
