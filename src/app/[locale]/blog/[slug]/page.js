import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { getBlogStaticParams, getPostBySlug } from "@/lib/blog";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { BackLink } from "@/components/shared/BackLink";
import { PageShell } from "@/components/shared/PageShell";

export const dynamicParams = false;

export function generateStaticParams() {
  return getBlogStaticParams();
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const post = getPostBySlug(locale, slug);
  if (!post) {
    return { title: "Post | Roberto Gianocca" };
  }
  return {
    title: `${post.title} | Blog | Roberto Gianocca`,
    description: post.excerpt,
    alternates: buildAlternates(`/blog/${slug}`, routing),
    ...(post.coverImage
      ? { openGraph: { images: [{ url: post.coverImage }] } }
      : {}),
  };
}

export default async function BlogPostPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Blog");
  const post = getPostBySlug(locale, slug);

  if (!post) {
    notFound();
  }

  const dateFormatted = post.date
    ? new Date(post.date).toLocaleDateString(locale === "it" ? "it-IT" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

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
              <time dateTime={post.date}>{dateFormatted}</time>
            ) : null}
            {post.tags && post.tags.length > 0 ? (
              <>
                <span aria-hidden>·</span>
                <ul className="flex flex-wrap gap-1" aria-label={t("tagsLabel")}>
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
