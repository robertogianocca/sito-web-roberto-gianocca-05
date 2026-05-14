/**
 * Converts a short Markdown string to plain text for meta tags / SEO.
 * Best-effort: resolves links to label text, strips common inline markers.
 *
 * @param {string} markdown
 * @returns {string}
 */
export function plainTextFromMarkdown(markdown) {
  if (typeof markdown !== "string" || markdown.length === 0) {
    return "";
  }

  let s = markdown;

  s = s.replace(/!\[([^\]]*)]\([^)]*\)/g, "$1");
  s = s.replace(/\[([^\]]*)]\([^)]*\)/g, "$1");
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/_([^_\s][^_]*)_/g, "$1");

  return s.replace(/\s+/g, " ").trim();
}
