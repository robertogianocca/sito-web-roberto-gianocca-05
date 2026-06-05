import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_BASE_DIR = path.join(process.cwd(), "src/content/blog");

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

function blogDir(locale) {
  return path.join(BLOG_BASE_DIR, locale);
}

/**
 * Returns all posts for the given locale sorted by date descending.
 * Falls back to the "it" directory if the locale directory does not exist.
 * Drafts are hidden in production and visible in development.
 *
 * @param {string} [locale="en"]
 * @returns {PostMeta[]}
 */
export function getAllPosts(locale = "en") {
  const dir = blogDir(locale);

  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(dir, filename), "utf8");
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
 * Falls back gracefully if the locale directory or file does not exist.
 *
 * @param {string} locale
 * @param {string} slug
 * @returns {Post | null}
 */
export function getPostBySlug(locale, slug) {
  const filePath = path.join(blogDir(locale), `${slug}.md`);
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

/**
 * Parametri per `generateStaticParams` su `/[locale]/blog/[slug]`.
 * Returns slugs derived from all available locales combined (deduplicated).
 */
export function getBlogStaticParams() {
  const locales = ["en", "it"];
  const slugSet = new Set();

  for (const locale of locales) {
    const dir = blogDir(locale);
    if (!fs.existsSync(dir)) continue;
    for (const filename of fs.readdirSync(dir)) {
      if (filename.endsWith(".md")) {
        slugSet.add(filename.replace(/\.md$/, ""));
      }
    }
  }

  return [...slugSet].map((slug) => ({ slug }));
}

/** Raccoglie tutti i tag unici dall'elenco post, ordinati alfabeticamente. */
export function collectBlogTags(posts) {
  const set = new Set();
  for (const p of posts) {
    for (const tag of p.tags ?? []) {
      set.add(tag);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
