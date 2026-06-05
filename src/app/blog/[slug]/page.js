import { notFound } from "next/navigation";
import { getBlogStaticParams, getPostBySlug } from "../../../lib/blog";
import { BlogPostBody } from "../../../components/blog/BlogPostBody";
import { BackLink } from "../../../components/shared/BackLink";
import { PageShell } from "../../../components/shared/PageShell";

export const dynamicParams = false;

export function generateStaticParams() {
  return getBlogStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: "Post | Roberto Gianocca" };
  }
  return {
    title: `${post.title} | Blog | Roberto Gianocca`,
    description: post.excerpt,
    ...(post.coverImage
      ? { openGraph: { images: [{ url: post.coverImage }] } }
      : {}),
  };
}

/** Formats an ISO date string for display. */
function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <PageShell
      header={
        <div className="space-y-2">
          <BackLink href="/blog" label="Blog" />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            {post.date ? (
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            ) : null}
            {post.tags && post.tags.length > 0 ? (
              <>
                <span aria-hidden>·</span>
                <ul className="flex flex-wrap gap-1" aria-label="Tag">
                  {post.tags.map((tag) => (
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
        </div>
      }
    >
      <div className="mx-auto max-w-2xl">
        <BlogPostBody content={post.content} />
      </div>
    </PageShell>
  );
}
