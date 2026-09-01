import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/contact/ContactForm.client";
import { BlogCard } from "@/components/blog/BlogCard";
import { HomeIntroNav } from "@/components/home/HomeIntroNav";
import { HorizontalScrollContainer } from "@/components/home/HorizontalScrollContainer.client";
import { HorizontalSection } from "@/components/home/HorizontalSection";
import { HomeSectionEmpty } from "@/components/home/HomeSectionEmpty";
import { HomeThumbRow } from "@/components/home/HomeThumbRow";
import { PlaceholderGrid } from "@/components/home/PlaceholderGrid";
import { HomeFeaturedVideo } from "@/components/video/HomeFeaturedVideo.client";
import { HomeVideoThumb } from "@/components/video/HomeVideoThumb";
import { HomePhotographyMosaic } from "@/components/photography/HomePhotographyMosaic.client";
import { HomeGalleryThumb } from "@/components/photography/HomeGalleryThumb";
import { getAllPosts } from "@/lib/blog";
import { buildAlternates } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { getHomeSectionCopy } from "@/data/home-sections";
import { getFeaturedVideo, getRecentVideos, normalizeVimeoId } from "@/data/videos";
import { getHomePhotographyData } from "@/lib/home-photography-data";
import { resolveLocalized } from "@/lib/i18n-content";
import { plainTextFromMarkdown } from "@/lib/plain-text-from-markdown";
import { fetchVimeoThumbnail } from "@/lib/vimeo";

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

  const featuredVideo = getFeaturedVideo();
  const recentVideos = getRecentVideos(3);

  function getVideoTitle(video) {
    return resolveLocalized(video?.title, locale);
  }

  function getVideoDescription(video) {
    return plainTextFromMarkdown(resolveLocalized(video?.subtitle, locale));
  }

  const featuredVimeoId = featuredVideo ? normalizeVimeoId(featuredVideo.vimeoId) : null;
  const featuredThumbnail =
    featuredVideo?.thumbnailUrl ??
    (featuredVimeoId ? await fetchVimeoThumbnail(featuredVimeoId) : null);

  const photography = await getHomePhotographyData(locale);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 lg:min-h-0">
      <HorizontalScrollContainer
        showScrollHints
        className="flex min-h-0 flex-1 flex-col lg:flex-row lg:flex-nowrap lg:overflow-x-auto lg:overflow-y-hidden"
        aria-label={t("portfolioAriaLabel")}
      >
        <HorizontalSection id="intro" title={null} span={5}>
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            <h2 className="sr-only">Roberto Gianocca</h2>
            <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
              <div className="col-span-12 max-w-prose">
                <p className="text-2xl font-bold">
                  {getHomeSectionCopy("intro", locale)
                    .description.split(/\r?\n/)
                    .map((line, idx, arr) => (
                      <span key={idx}>
                        {line}
                        {idx < arr.length - 1 ? <br /> : null}
                      </span>
                    ))}
                </p>
                <p className="mt-4 text-right text-base italic font-bold text-foreground">
                  Roberto Gianocca
                </p>
              </div>
              <div className="lg:col-span-6">
                <HomeIntroNav />
              </div>
              {/* <div className="lg:col-span-6">
                <PlaceholderGrid variant="hero" />
              </div> */}
            </div>
          </div>
        </HorizontalSection>

        <HorizontalSection
          id="photography"
          title={t("photographyTitle")}
          span={8}
          titleHref="/photography"
          titleHrefAriaLabel={t("photographyAriaLabel")}
          shortDescription={getHomeSectionCopy("photography", locale).shortDescription}
        >
          {photography ? (
            <div className="flex flex-col gap-4">
              <HomePhotographyMosaic
                carouselImages={photography.carouselImages}
                sideGalleries={photography.sideGalleries}
                title={photography.title}
                description={photography.description}
                detailHref={photography.detailHref}
                seeGalleryLabel={t("photographySeeGallery")}
                imageAspect={photography.aspect}
                pauseLabel={t("photographyPauseCarousel")}
                playLabel={t("photographyPlayCarousel")}
              />
              <HomeThumbRow href="/photography" label={t("photographyAllGalleries")}>
                {photography.recentGalleries.map((gallery) => (
                  <li key={gallery.slug}>
                    <HomeGalleryThumb
                      title={gallery.title}
                      coverSrc={gallery.coverSrc}
                      href={gallery.href}
                      aspect={photography.aspect}
                    />
                  </li>
                ))}
              </HomeThumbRow>
            </div>
          ) : (
            <HomeSectionEmpty message={t("photographyEmpty")} />
          )}
        </HorizontalSection>

        <HorizontalSection
          id="video"
          title={t("videoTitle")}
          span={8}
          titleHref="/video"
          titleHrefAriaLabel={t("videoAriaLabel")}
          shortDescription={getHomeSectionCopy("video", locale).shortDescription}
        >
          {featuredVideo && featuredVimeoId ? (
            <div className="flex flex-col gap-4">
              <HomeFeaturedVideo
                vimeoId={featuredVimeoId}
                title={getVideoTitle(featuredVideo)}
                description={getVideoDescription(featuredVideo)}
                thumbnailUrl={featuredThumbnail}
                thumbnailAlt={getVideoTitle(featuredVideo)}
                detailHref={`/video/${featuredVideo.slug}`}
                seeProjectLabel={t("videoSeeProject")}
                playLabel={t("videoPlayAriaLabel", {
                  title: getVideoTitle(featuredVideo),
                })}
              />
              <HomeThumbRow href="/video" label={t("videoAllVideos")}>
                {recentVideos.map((video, i) => (
                  <li key={`${video.slug}-${i}`}>
                    <HomeVideoThumb
                      title={getVideoTitle(video)}
                      thumbnailUrl={video.thumbnailUrl}
                      thumbnailAlt={getVideoTitle(video)}
                      href={`/video/${video.slug}`}
                    />
                  </li>
                ))}
              </HomeThumbRow>
            </div>
          ) : (
            <HomeSectionEmpty message={t("videoEmpty")} />
          )}
        </HorizontalSection>

        <HorizontalSection
          id="graphic-design"
          title={t("graphicDesignTitle")}
          span={10}
          shortDescription={getHomeSectionCopy("graphicDesign", locale).shortDescription}
        >
          <PlaceholderGrid variant="mixed" />
        </HorizontalSection>

        <HorizontalSection
          id="blog"
          title={t("blogTitle")}
          span={6}
          titleHref="/blog"
          titleHrefAriaLabel={t("blogAriaLabel")}
          shortDescription={getHomeSectionCopy("blog", locale).shortDescription}
        >
          <div className="flex h-full flex-col gap-5">
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
                      headingLevel={3}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <HomeSectionEmpty message={t("blogEmpty")} />
            )}
          </div>
        </HorizontalSection>

        <HorizontalSection
          id="contact"
          title={t("contactTitle")}
          span={4}
          shortDescription={getHomeSectionCopy("contact", locale).shortDescription}
        >
          <ContactForm />
        </HorizontalSection>
      </HorizontalScrollContainer>
    </div>
  );
}
