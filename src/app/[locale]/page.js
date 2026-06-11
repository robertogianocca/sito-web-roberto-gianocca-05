import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/contact/ContactForm.client";
import { BlogCard } from "@/components/blog/BlogCard";
import { HomeIntroNav } from "@/components/home/HomeIntroNav";
import { HorizontalScrollContainer } from "@/components/home/HorizontalScrollContainer.client";
import { HorizontalSection } from "@/components/home/HorizontalSection";
import { PlaceholderGrid } from "@/components/home/PlaceholderGrid";
import { HomeFeaturedVideo } from "@/components/video/HomeFeaturedVideo.client";
import { HomeVideoThumb } from "@/components/video/HomeVideoThumb";
import { HomePhotographyMosaic } from "@/components/photography/HomePhotographyMosaic.client";
import { HomeGalleryThumb } from "@/components/photography/HomeGalleryThumb";
import { getAllPosts } from "@/lib/blog";
import { buildAlternates } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getHomeSectionCopy } from "@/data/home-sections";
import { getFeaturedVideo, getRecentVideos, normalizeVimeoId } from "@/data/videos";
import { resolveLocalized } from "@/lib/i18n-content";
import { fetchVimeoThumbnail } from "@/lib/vimeo";
import {
  getFeaturedGallery,
  getSideGalleries,
  getRecentGalleries,
} from "@/data/photography-galleries";
import {
  buildCloudinaryImageUrl,
  fetchFolderGallery,
  fetchFolderGalleryDetail,
  isCloudinaryConfigured,
} from "@/lib/cloudinary-server";

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
    return resolveLocalized(video?.shortDescription, locale);
  }

  const featuredVimeoId = featuredVideo ? normalizeVimeoId(featuredVideo.vimeoId) : null;
  const featuredThumbnail =
    featuredVideo?.thumbnailUrl ??
    (featuredVimeoId ? await fetchVimeoThumbnail(featuredVimeoId) : null);

  // ── Photography mosaic data ────────────────────────────────────────────────
  const featuredGallery = getFeaturedGallery();
  const sideGalleriesList = getSideGalleries(2);
  const recentGalleriesList = getRecentGalleries(2, 3);

  function getGalleryTitle(gallery) {
    return resolveLocalized(gallery?.title, locale);
  }

  function getGalleryDescription(gallery) {
    const raw = resolveLocalized(gallery?.shortDescription, locale);
    return raw.replace(/\*+([^*]+)\*+/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? null;
  const cloudinaryReady = isCloudinaryConfigured();

  const [cropWRatio, cropHRatio] = (featuredGallery?.homeImageAspect ?? "4/3")
    .split("/")
    .map(Number);
  const cropW = 1200;
  const cropH = Math.round((cropW * cropHRatio) / cropWRatio);

  let carouselImages = [];
  if (featuredGallery && cloudinaryReady) {
    if (featuredGallery.homeImages?.length) {
      carouselImages = featuredGallery.homeImages.map((publicId) => ({
        src: buildCloudinaryImageUrl(cloudName, publicId, {
          width: cropW,
          height: cropH,
          crop: "fill",
        }),
        alt: publicId.split("/").pop()?.replace(/[-_]/g, " ") ?? "Photography",
      }));
    } else {
      const detail = await fetchFolderGalleryDetail(featuredGallery.folder);
      const count = featuredGallery.homeImageCount ?? 4;
      if (detail.ok) {
        carouselImages = detail.slides.slice(0, count).map((s) => ({ src: s.src, alt: s.alt }));
      }
    }
  }

  const sideGalleriesData = await Promise.all(
    sideGalleriesList.map(async (g) => {
      if (!cloudinaryReady)
        return { src: null, alt: getGalleryTitle(g), href: `/photography/${g.slug}` };
      const data = await fetchFolderGallery(g.folder);
      return {
        src: data.ok ? data.coverSrc : null,
        alt: getGalleryTitle(g),
        href: `/photography/${g.slug}`,
      };
    }),
  );

  // If fewer than 2 other galleries exist, fill side slots with carousel images
  // from the featured gallery so the mosaic is never visually empty.
  const filledSideGalleries = [...sideGalleriesData];
  if (featuredGallery) {
    while (filledSideGalleries.length < 2) {
      const fallbackIdx = filledSideGalleries.length + 1;
      const fallbackSrc =
        carouselImages[fallbackIdx % Math.max(carouselImages.length, 1)]?.src ??
        carouselImages[0]?.src ??
        null;
      filledSideGalleries.push({
        src: fallbackSrc,
        alt: getGalleryTitle(featuredGallery),
        href: `/photography/${featuredGallery.slug}`,
      });
    }
  }

  const recentGalleryCovers = await Promise.all(
    recentGalleriesList.map(async (g) => {
      if (!cloudinaryReady) return null;
      const data = await fetchFolderGallery(g.folder);
      return data.ok ? data.coverSrc : null;
    }),
  );
  // ── end Photography mosaic data ───────────────────────────────────────────

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 lg:min-h-0">
      <HorizontalScrollContainer
        showScrollHints
        className="flex min-h-0 flex-1 flex-col lg:flex-row lg:flex-nowrap lg:overflow-x-auto lg:overflow-y-hidden"
        aria-label={t("portfolioAriaLabel")}
      >
        <HorizontalSection
          id="intro"
          title="Roberto Gianocca"
          span={9}
          shortDescription={getHomeSectionCopy("intro", locale).shortDescription}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
              <div className="lg:col-span-6">
                <HomeIntroNav />
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
          shortDescription={getHomeSectionCopy("photography", locale).shortDescription}
        >
          {featuredGallery ? (
            <div className="flex flex-col gap-4">
              <HomePhotographyMosaic
                carouselImages={carouselImages}
                sideGalleries={filledSideGalleries}
                title={getGalleryTitle(featuredGallery)}
                description={getGalleryDescription(featuredGallery)}
                detailHref={`/photography/${featuredGallery.slug}`}
                seeGalleryLabel={t("photographySeeGallery")}
                imageAspect={featuredGallery.homeImageAspect ?? "3/4"}
              />
              <div className="flex items-end gap-3">
                <ul className="grid flex-1 grid-cols-3 gap-3">
                  {recentGalleriesList.map((g, i) => (
                    <li key={g.slug}>
                      <HomeGalleryThumb
                        title={getGalleryTitle(g)}
                        coverSrc={recentGalleryCovers[i]}
                        href={`/photography/${g.slug}`}
                        aspect={featuredGallery.homeImageAspect ?? "4/3"}
                      />
                    </li>
                  ))}
                </ul>
                <Link
                  href="/photography"
                  className="shrink-0 text-xs font-medium text-zinc-500 underline-offset-2 hover:text-foreground hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  {t("photographyAllGalleries")} →
                </Link>
              </div>
            </div>
          ) : null}
        </HorizontalSection>

        <HorizontalSection
          id="video"
          title="Video"
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
              />
              <div className="flex items-end gap-3">
                <ul className="grid flex-1 grid-cols-3 gap-3">
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
                </ul>
                <Link
                  href="/video"
                  className="shrink-0 text-xs font-medium text-zinc-500 underline-offset-2 hover:text-foreground hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  {t("videoAllVideos")} →
                </Link>
              </div>
            </div>
          ) : null}
        </HorizontalSection>

        <HorizontalSection
          id="graphic-design"
          title="Graphic design"
          span={10}
          shortDescription={getHomeSectionCopy("graphicDesign", locale).shortDescription}
        >
          <PlaceholderGrid variant="mixed" />
        </HorizontalSection>

        <HorizontalSection
          id="blog"
          title="Blog"
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
                    />
                  </li>
                ))}
              </ul>
            ) : null}
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
