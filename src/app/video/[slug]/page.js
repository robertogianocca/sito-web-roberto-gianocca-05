import Link from "next/link";
import { notFound } from "next/navigation";
import { VimeoPlayer } from "../../../components/video/VimeoPlayer";
import { ErrorPanel } from "../../../components/shared/ErrorPanel";
import { getVideoBySlug, getVideoStaticParams, normalizeVimeoId } from "../../../data/videos";

export const dynamicParams = false;

export function generateStaticParams() {
  return getVideoStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const video = getVideoBySlug(slug);
  if (!video) {
    return { title: "Video | Roberto Gianocca" };
  }
  return {
    title: `${video.title} | Video | Roberto Gianocca`,
    description: video.shortDescription,
  };
}

const BACK = { href: "/video", label: "Video" };

export default async function VideoDetailPage({ params }) {
  const { slug } = await params;
  const video = getVideoBySlug(slug);
  if (!video) {
    notFound();
  }

  const vimeoId = normalizeVimeoId(video.vimeoId);
  if (!vimeoId) {
    return (
      <ErrorPanel
        backHref={BACK.href}
        backLabel={BACK.label}
        title="Id Vimeo non valido"
        body="Il campo vimeoId nel manifest deve contenere solo cifre. Correggi src/data/videos.js e rideploy."
      />
    );
  }

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 md:px-10 md:py-12">
        <Link
          href="/video"
          className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-foreground hover:underline dark:text-zinc-400"
        >
          ← Video
        </Link>

        <header className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{video.title}</h1>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{video.shortDescription}</p>
        </header>

        <VimeoPlayer vimeoId={vimeoId} title={video.title} />
      </div>
    </div>
  );
}
