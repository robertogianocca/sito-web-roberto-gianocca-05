import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/contact/ContactForm.client";
import { BlogCard } from "@/components/blog/BlogCard";
import { HomeIntroNav } from "@/components/home/HomeIntroNav";
import { HorizontalScrollContainer } from "@/components/home/HorizontalScrollContainer.client";
import { HorizontalSection } from "@/components/home/HorizontalSection";
import { PlaceholderGrid } from "@/components/home/PlaceholderGrid";
import { LanguageSwitcher } from "@/components/home/LanguageSwitcher.client";
import { getAllPosts } from "@/lib/blog";
import { buildAlternates } from "@/lib/metadata";
import { routing } from "@/i18n/routing";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: "Roberto Gianocca",
    description: t("homeDescription"),
    alternates: buildAlternates("/", routing),
  };
}

export default async function Home({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const latestPosts = getAllPosts(locale).slice(0, 2);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 lg:min-h-0">
      <HorizontalScrollContainer
        showScrollHints
        className="flex min-h-0 flex-1 flex-col lg:flex-row lg:flex-nowrap lg:overflow-x-auto lg:overflow-y-hidden"
        aria-label={t("portfolioAriaLabel")}
      >
        <HorizontalSection id="intro" title="Roberto Gianocca" span={9}>
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
              <div className="lg:col-span-6">
                <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {t("introText")}
                </p>
                <HomeIntroNav />
                <LanguageSwitcher />
              </div>
              <div className="lg:col-span-6">
                <PlaceholderGrid variant="hero" />
              </div>
            </div>
          </div>
        </HorizontalSection>

        <HorizontalSection
          id="photography"
          title="Photography"
          span={8}
          titleHref="/photography"
          titleHrefAriaLabel={t("photographyAriaLabel")}
        >
          <div className="flex h-full flex-col gap-6">
            <p className="max-w-prose text-zinc-600 dark:text-zinc-400">
              {t("photographyDescription")}
            </p>
            <PlaceholderGrid variant="mixed" />
          </div>
        </HorizontalSection>

        <HorizontalSection
          id="video"
          title="Video"
          span={6}
          titleHref="/video"
          titleHrefAriaLabel={t("videoAriaLabel")}
        >
          <div className="flex h-full flex-col gap-6">
            <p className="max-w-prose text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("videoDescription")}
            </p>
            <PlaceholderGrid variant="row" />
          </div>
        </HorizontalSection>

        <HorizontalSection id="graphic-design" title="Graphic design" span={10}>
          <div className="flex h-full flex-col gap-6">
            <p className="max-w-prose text-zinc-600 dark:text-zinc-400">
              {t("graphicDesignDescription")}
            </p>
            <PlaceholderGrid variant="mixed" />
          </div>
        </HorizontalSection>

        <HorizontalSection
          id="blog"
          title="Blog"
          span={6}
          titleHref="/blog"
          titleHrefAriaLabel={t("blogAriaLabel")}
        >
          <div className="flex h-full flex-col gap-5">
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("blogDescription")}
            </p>
            {latestPosts.length > 0 ? (
              <ul className="flex flex-col gap-4">
                {latestPosts.map((post) => (
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
            ) : null}
          </div>
        </HorizontalSection>

        <HorizontalSection id="contact" title={t("contactTitle")} span={4}>
          <div className="flex h-full min-h-0 flex-col gap-4">
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("contactDescription")}
            </p>
            <ContactForm />
          </div>
        </HorizontalSection>
      </HorizontalScrollContainer>
    </div>
  );
}
