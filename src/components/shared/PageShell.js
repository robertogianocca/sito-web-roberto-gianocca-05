/**
 * Common outer shell for the Photography and Video listing pages.
 * Standardises padding (px-6 mobile, md:px-10 desktop) and the header/main structure
 * so both pages share a single source of truth for layout values.
 *
 * @param {{
 *   header: import("react").ReactNode;
 *   children: import("react").ReactNode;
 * }} props
 */
export function PageShell({ header, children }) {
  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200/80 bg-background/80 px-6 py-6 backdrop-blur dark:border-zinc-800/80 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          {header}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-12">{children}</main>
    </div>
  );
}
