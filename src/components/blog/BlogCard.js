import Image from "next/image";
import Link from "next/link";

/**
 * Formats an ISO date string (YYYY-MM-DD) into a localised Italian display string.
 * @param {string} date
 * @returns {string}
 */
function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * @param {{
 *   title: string;
 *   date: string;
 *   excerpt: string;
 *   tags?: string[];
 *   coverImage?: string | null;
 *   href: string;
 * }} props
 */
export function BlogCard({ title, date, excerpt, tags, coverImage, href }) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-xl outline-offset-2 focus-visible:outline-2 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-background shadow-sm transition-[box-shadow,transform] group-hover:shadow-md group-hover:ring-1 group-hover:ring-zinc-300/80 dark:border-zinc-800/90 dark:group-hover:ring-zinc-600/80">
        {coverImage ? (
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            <Image
              src={coverImage}
              alt={`Copertina: ${title}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            {date ? (
              <time
                dateTime={date}
                className="text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400"
              >
                {formatDate(date)}
              </time>
            ) : null}
            {tags && tags.length > 0 ? (
              <>
                <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>·</span>
                <ul className="flex flex-wrap gap-1" aria-label="Tag">
                  {tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
            {title}
          </h2>

          {excerpt ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {excerpt}
            </p>
          ) : null}

          <span className="mt-auto pt-1 text-xs font-medium text-zinc-500 underline-offset-2 group-hover:underline dark:text-zinc-400">
            Leggi →
          </span>
        </div>
      </article>
    </Link>
  );
}
