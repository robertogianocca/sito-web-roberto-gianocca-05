import { getAllPosts, collectBlogTags } from "../../lib/blog";
import { BlogCard } from "../../components/blog/BlogCard";
import { BackLink } from "../../components/shared/BackLink";
import { PageShell } from "../../components/shared/PageShell";
import { TagFilter } from "../../components/shared/TagFilter";

export const metadata = {
  title: "Blog | Roberto Gianocca",
  description: "Aggiornamenti, riflessioni e progetti.",
};

export default async function BlogPage({ searchParams }) {
  const { tag } = await searchParams;
  const activeTag = typeof tag === "string" && tag.length > 0 ? tag : null;

  const allPosts = getAllPosts();
  const allTags = collectBlogTags(allPosts);

  const filtered =
    activeTag !== null
      ? allPosts.filter((p) => (p.tags ?? []).includes(activeTag))
      : allPosts;

  return (
    <PageShell
      header={
        <div className="space-y-2">
          <BackLink href="/" label="Torna al portfolio" />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Blog
          </h1>
          <p className="max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
            Aggiornamenti e pensieri — aggiungi post in{" "}
            <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-xs dark:bg-zinc-800/80">
              src/content/blog/
            </code>
            .
          </p>
          {allTags.length > 0 ? (
            <TagFilter basePath="/blog" tags={allTags} activeTag={activeTag} />
          ) : null}
        </div>
      }
    >
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300/80 bg-background p-8 text-zinc-600 dark:border-zinc-700/80 dark:text-zinc-400">
          <p className="font-medium text-foreground">
            {activeTag
              ? `Nessun post con il tag "${activeTag}"`
              : "Nessun post pubblicato"}
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            {activeTag ? (
              <>
                Prova a selezionare un altro tag oppure{" "}
                <a
                  href="/blog"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  mostra tutti i post
                </a>
                .
              </>
            ) : (
              <>
                Crea un file{" "}
                <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
                  .md
                </code>{" "}
                in{" "}
                <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
                  src/content/blog/
                </code>{" "}
                per pubblicare il primo post.
              </>
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
              />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
