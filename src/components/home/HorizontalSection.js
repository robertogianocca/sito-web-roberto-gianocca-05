/**
 * Thematic panel: full viewport height on lg+, width = (span/12) * 100vw.
 * --span is read by .horizontal-section rules in globals.css (lg+ only).
 */
export function HorizontalSection({
  id,
  title,
  eyebrow,
  span = 12,
  children,
}) {
  return (
    <section
      id={id}
      className="horizontal-section flex flex-col border-b border-zinc-200/80 bg-background snap-start dark:border-zinc-800/80 lg:border-b-0 lg:border-r"
      style={{ "--span": String(span) }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
        <header className="shrink-0 space-y-2">
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h2>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
          {children}
        </div>
      </div>
    </section>
  );
}
