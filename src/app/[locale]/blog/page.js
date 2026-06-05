import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { getAllPosts, collectBlogTags } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { BackLink } from "@/components/shared/BackLink";
import { PageShell } from "@/components/shared/PageShell";
import { TagFilter } from "@/components/shared/TagFilter";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  return {
    title: `Blog | Roberto Gianocca`,
    description: t("metaDescription"),
    alternates: buildAlternates("/blog", routing),
  };
}

export default async function BlogPage({ params, searchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Blog");

  const { tag } = await searchParams;
  const activeTag = typeof tag === "string" && tag.length > 0 ? tag : null;

  const allPosts = getAllPosts(locale);
  const allTags = collectBlogTags(allPosts);

  const filtered =
    activeTag !== null
      ? allPosts.filter((p) => (p.tags ?? []).includes(activeTag))
      : allPosts;

  return (
    <PageShell
      header={
        <div className="space-y-2">
          <BackLink href="/" label={t("backLabel")} />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Blog
          </h1>
          <p className="max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
            {t("description")}
          </p>
          {allTags.length > 0 ? (
            <TagFilter basePath="/blog" tags={allTags} activeTag={activeTag} allLabel={t("allLabel")} />
          ) : null}
        </div>
      }
    >
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300/80 bg-background p-8 text-zinc-600 dark:border-zinc-700/80 dark:text-zinc-400">
          <p className="font-medium text-foreground">
            {activeTag ? t("noPostWithTag", { tag: activeTag }) : t("noPosts")}
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            {activeTag ? (
              <>
                {t("tryOtherTag")}{" "}
                <a
                  href={`/${locale}/blog`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {t("showAllPosts")}
                </a>
                .
              </>
            ) : (
              t("createPost")
            )}
          </p>
        </div>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <li key={post.slug}>
              <BlogCard
                title={post.title}
                date={post.date}
                excerpt={post.excerpt}
                tags={post.tags}
                coverImage={post.coverImage}
                href={`/blog/${post.slug}`}
                locale={locale}
              />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
