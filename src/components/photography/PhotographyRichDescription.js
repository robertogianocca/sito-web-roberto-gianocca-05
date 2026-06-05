import Link from "next/link";
import ReactMarkdown from "react-markdown";

const bodyClass = "text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";

const linkClass =
  "font-medium text-zinc-700 underline decoration-zinc-400/80 underline-offset-2 hover:text-foreground dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-foreground";

/**
 * @param {{
 *   node?: unknown;
 *   href?: string | null;
 *   children?: import("react").ReactNode;
 *   className?: string;
 *   title?: string;
 * }} props
 */
function MarkdownLink({ node: _node, href, children, className, title }) {
  if (!href || typeof href !== "string") {
    return <span className={className}>{children}</span>;
  }

  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} className={[linkClass, className].filter(Boolean).join(" ")} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={[linkClass, className].filter(Boolean).join(" ")}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

/**
 * Markdown in repo data: **bold**, *italic*, [label](url), root paths with `/...`.
 *
 * @param {{ markdown: string }} props
 */
export function PhotographyRichDescription({ markdown }) {
  return (
    <div className={bodyClass}>
      <ReactMarkdown
        components={{
          p({ children }) {
            return <p className="m-0 not-last:mb-2 text-sm">{children}</p>;
          },
          strong({ children }) {
            return <strong className="font-semibold text-foreground">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
          a: MarkdownLink,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
