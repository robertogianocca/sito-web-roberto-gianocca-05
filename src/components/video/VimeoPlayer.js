/**
 * @param {{ vimeoId: string; title: string }} props
 */
export function VimeoPlayer({ vimeoId, title }) {
  const src = `https://player.vimeo.com/video/${vimeoId}?dnt=1`;

  return (
    <div className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-zinc-200/90 bg-black shadow-sm dark:border-zinc-800/90">
      <div className="relative aspect-video w-full">
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
