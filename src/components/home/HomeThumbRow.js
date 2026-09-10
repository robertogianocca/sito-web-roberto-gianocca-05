/**
 * Row of section thumbnails.
 * Shared by the Photography and Video panels so both keep the same rhythm.
 *
 * @param {{
 *   children: import('react').ReactNode;
 * }} props
 */
export function HomeThumbRow({ children }) {
  return <ul className="grid grid-cols-3 gap-3">{children}</ul>;
}
