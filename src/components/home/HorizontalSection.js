import { Link } from "@/i18n/navigation";
import { HomeCtaLink } from "@/components/home/HomeCtaLink";

/**
 * Thematic panel: full viewport height on lg+, width = (span/12) * 100vw.
 * --span is read by .horizontal-section rules in globals.css (lg+ only).
 *
 * @param {{
 *   id?: string;
 *   title?: string;
 *   eyebrow?: string;
 *   span?: number;
 *   titleHref?: string;
 *   titleHrefAriaLabel?: string;
 *   ctaHref?: string;
 *   ctaLabel?: string;
 *   shortDescription?: string;
 *   children?: import('react').ReactNode;
 * }} props
 */
export function HorizontalSection({
  id,
  title,
  eyebrow,
  span = 12,
  titleHref,
  titleHrefAriaLabel,
  ctaHref,
  ctaLabel,
  shortDescription,
  children,
}) {
  const hasTitle = title != null && title !== "";
  const hasCta = Boolean(ctaHref && ctaLabel);
  const hasHeader =
    hasTitle || Boolean(eyebrow) || Boolean(shortDescription) || hasCta;

  const titleNode = hasTitle ? (
    titleHref != null && titleHref !== "" ? (
      <Link
        href={titleHref}
        className="text-foreground underline-offset-4 transition-colors hover:text-zinc-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:hover:text-zinc-200 dark:focus-visible:outline-zinc-500"
      >
        {title}
        {titleHrefAriaLabel ? (
          <span className="sr-only">{titleHrefAriaLabel}</span>
        ) : null}
      </Link>
    ) : (
      title
    )
  ) : null;

  return (
    <section
      id={id}
      className="horizontal-section flex flex-col border-b border-zinc-200/80 bg-background dark:border-zinc-800/80 lg:border-b-0 lg:border-r"
      style={{ "--span": span }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
        {hasHeader ? (
          <header className="shrink-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-5">
              {hasTitle || eyebrow || hasCta ? (
                <div className="shrink-0 space-y-3">
                  {eyebrow ? (
                    <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      {eyebrow}
                    </p>
                  ) : null}
                  {hasTitle ? (
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                      {titleNode}
                    </h2>
                  ) : null}
                  {hasCta ? (
                    <HomeCtaLink href={ctaHref} showArrow>
                      {ctaLabel}
                    </HomeCtaLink>
                  ) : null}
                </div>
              ) : null}
              {shortDescription ? (
                <p className="max-w-prose text-lg font-bold text-zinc-600 dark:text-zinc-400 lg:pt-1">
                  {shortDescription}
                </p>
              ) : null}
            </div>
          </header>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </section>
  );
}
