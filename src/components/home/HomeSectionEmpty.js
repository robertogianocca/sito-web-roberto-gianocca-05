/**
 * Placeholder shown when a homepage panel has no content to feature yet.
 * Without it the panel renders its title over a blank body.
 *
 * @param {{ message: string }} props
 */
export function HomeSectionEmpty({ message }) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center rounded-xl border border-dashed border-zinc-300/80 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700/80 dark:text-zinc-400">
      <p>{message}</p>
    </div>
  );
}
