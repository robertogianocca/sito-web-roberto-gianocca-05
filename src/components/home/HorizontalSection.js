import { Link } from "@/i18n/navigation";

function LinkOutIcon({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7 17L17 7M17 7H9M17 7V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Thematic panel: full viewport height on lg+, width = (span/12) * 100vw.
 * --span is read by .horizontal-section rules in globals.css (lg+ only).
 */
export function HorizontalSection({
  id,
  title,
  eyebrow,
  span = 12,
  titleHref,
  titleHrefAriaLabel,
  children,
}) {
  const titleContent =
    titleHref != null && titleHref !== "" ? (
      <Link
        href={titleHref}
        className="group inline-flex max-w-full items-center gap-2 text-foreground underline-offset-4 transition-colors hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:hover:text-zinc-200 dark:focus-visible:outline-zinc-500"
      >
        <span className="min-w-0 group-hover:underline">{title}</span>
        <LinkOutIcon className="size-5 shrink-0 text-zinc-500 transition-colors group-hover:text-foreground dark:text-zinc-400" />
        {titleHrefAriaLabel ? <span className="sr-only">{titleHrefAriaLabel}</span> : null}
      </Link>
    ) : (
      title
    );

  return (
    <section
      id={id}
      className="horizontal-section flex flex-col border-b border-zinc-200/80 bg-background dark:border-zinc-800/80 lg:border-b-0 lg:border-r"
      style={{ "--span": span }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
        <header className="shrink-0 space-y-2">
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {titleContent}
          </h2>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
          {children}
        </div>
      </div>
    </section>
  );
}
