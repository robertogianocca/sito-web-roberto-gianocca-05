import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

const isDev = process.env.NODE_ENV === "development";

/**
 * @typedef {{
 *   slug: string;
 *   title: string;
 *   date: string;
 *   excerpt: string;
 *   tags?: string[];
 *   coverImage?: string;
 *   draft?: boolean;
 * }} PostMeta
 *
 * @typedef {PostMeta & { content: string }} Post
 */

/**
 * Returns all posts sorted by date descending.
 * Drafts are hidden in production and visible in development.
 *
 * @returns {PostMeta[]}
 */
export function getAllPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf8");
    const { data } = matter(raw);

    return {
      slug,
      title: data.title ?? slug,
      date: data.date ?? "",
      excerpt: data.excerpt ?? "",
      tags: data.tags ?? [],
      coverImage: data.coverImage ?? null,
      draft: data.draft ?? false,
    };
  });

  return posts
    .filter((p) => isDev || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Returns a single post including its markdown body, or null if not found.
 *
 * @param {string} slug
 * @returns {Post | null}
 */
export function getPostBySlug(slug) {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const draft = data.draft ?? false;
  if (!isDev && draft) return null;

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    excerpt: data.excerpt ?? "",
    tags: data.tags ?? [],
    coverImage: data.coverImage ?? null,
    draft,
    content,
  };
}

/** Parametri per `generateStaticParams` su `/blog/[slug]`. */
export function getBlogStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

/** Raccoglie tutti i tag unici dall'elenco post, ordinati alfabeticamente. */
export function collectBlogTags(posts) {
  const set = new Set();
  for (const p of posts) {
    for (const tag of p.tags ?? []) {
      set.add(tag);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "it"));
}
