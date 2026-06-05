import ReactMarkdown from "react-markdown";

/**
 * Renders a markdown string as a styled prose article body.
 * All styling is done via Tailwind utility classes — no external CSS or plugins needed.
 *
 * @param {{ content: string }} props
 */
export function BlogPostBody({ content }) {
  return (
    <div className="prose-blog">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 text-3xl font-bold tracking-tight text-foreground first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-8 text-2xl font-semibold tracking-tight text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 text-xl font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-5 leading-relaxed text-zinc-700 dark:text-zinc-300">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-5 list-disc pl-6 text-zinc-700 dark:text-zinc-300 [&>li]:mb-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-5 list-decimal pl-6 text-zinc-700 dark:text-zinc-300 [&>li]:mb-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-5 border-l-4 border-zinc-300 pl-4 italic text-zinc-600 dark:border-zinc-600 dark:text-zinc-400">
              {children}
            </blockquote>
          ),
          code: ({ inline, children, ...props }) =>
            inline ? (
              <code
                className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className="block overflow-x-auto rounded-lg bg-zinc-100 p-4 font-mono text-sm leading-relaxed text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200"
                {...props}
              >
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="mb-5 overflow-x-auto rounded-lg bg-zinc-100 dark:bg-zinc-800/80">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-foreground underline underline-offset-4 hover:opacity-75"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className="my-8 border-zinc-200 dark:border-zinc-800" />
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-700 dark:text-zinc-300">{children}</em>
          ),
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt ?? ""}
              className="my-6 w-full rounded-xl object-cover"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
