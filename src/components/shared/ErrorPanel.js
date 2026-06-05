import { BackLink } from "./BackLink";

/**
 * @param {{
 *   backHref: string;
 *   backLabel: string;
 *   title: string;
 *   body: string;
 * }} props
 */
export function ErrorPanel({ backHref, backLabel, title, body }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 bg-zinc-50 p-8 dark:bg-zinc-950 md:p-12">
      <BackLink href={backHref} label={backLabel} />
      <div className="max-w-lg space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{body}</p>
      </div>
    </div>
  );
}
