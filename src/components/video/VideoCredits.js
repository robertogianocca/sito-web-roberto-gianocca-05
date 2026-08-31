import { resolveLocalized } from "@/lib/i18n-content";

/**
 * @param {{
 *   credits: Array<{ role: string | Record<string, string>, names: string }>;
 *   locale: string;
 * }} props
 */
export function VideoCredits({ credits, locale }) {
  if (!credits?.length) {
    return null;
  }

  return (
    <dl className="space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
      {credits.map((credit, index) => {
        const role = resolveLocalized(credit.role, locale);
        return (
          <div key={`${role}-${index}`}>
            <dt className="inline font-medium text-foreground">{role}:</dt>
            <dd className="inline ml-1">{credit.names}</dd>
          </div>
        );
      })}
    </dl>
  );
}
