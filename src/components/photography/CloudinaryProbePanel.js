import Image from "next/image";

/**
 * Dev-only panel that shows Cloudinary API connectivity and a preview image.
 * Rendered only when `PHOTOGRAPHY_ENABLE_PROBE=1` and the probe result is available.
 *
 * @param {{
 *   probe: import("../../lib/cloudinary-server").CloudinaryProbeResult | null;
 * }} props
 */
export function CloudinaryProbePanel({ probe }) {
  if (!probe) return null;

  return (
    <aside className="shrink-0 space-y-4 lg:sticky lg:top-8 lg:w-[min(100%,22rem)]">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Verifica Cloudinary (dev)
      </p>
      {probe.ok ? (
        <>
          <dl className="space-y-1 rounded-lg border border-zinc-200/90 bg-background p-4 text-xs text-zinc-600 dark:border-zinc-800/90 dark:text-zinc-400">
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">Public ID</dt>
              <dd className="font-mono text-right text-foreground">{probe.publicId}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">Cloud</dt>
              <dd className="font-mono text-right">{probe.cloudName}</dd>
            </div>
            {probe.width != null ? (
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Dimensioni</dt>
                <dd>
                  {probe.width}&times;{probe.height} &middot; {probe.format} &middot;{" "}
                  {probe.bytes != null ? `${Math.round(probe.bytes / 1024)} KB` : "\u2014"}
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-100 dark:border-zinc-800/90 dark:bg-zinc-900">
            <Image
              src={probe.previewSrc}
              alt="Anteprima verifica API Cloudinary"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 22rem"
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Abilita con{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-900">
              PHOTOGRAPHY_ENABLE_PROBE=1
            </code>
            . Opzionale:{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-900">
              PHOTOGRAPHY_PROBE_PUBLIC_ID
            </code>
            .
          </p>
        </>
      ) : (
        <div className="rounded-lg border border-amber-200/90 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-medium">Fetch non riuscito</p>
          <p className="mt-1 text-xs opacity-90">
            {probe.reason === "missing_env"
              ? "Variabili CLOUDINARY_* mancanti."
              : (probe.message ?? probe.reason)}
          </p>
        </div>
      )}
    </aside>
  );
}
