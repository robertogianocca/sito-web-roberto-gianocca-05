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
import { resolveLocalized } from "@/lib/i18n-content";

const CAROUSEL_CROP_WIDTH = 1200;
const DEFAULT_ASPECT = "4/3";
const DEFAULT_CAROUSEL_COUNT = 4;
const SIDE_SLOT_COUNT = 2;
const RECENT_THUMB_COUNT = 3;

function galleryHref(gallery) {
  return `/photography/${gallery.slug}`;
}

/** The manifest allows emphasis and links in shortDescription; the mosaic renders plain text. */
function plainDescription(value, locale) {
  return resolveLocalized(value, locale)
    .replace(/\*+([^*]+)\*+/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function altFromPublicId(publicId) {
  return publicId.split("/").pop()?.replace(/[-_]/g, " ") ?? "Photography";
}

/**
 * Carousel frames for slot A. `homeImages` picks exact public ids; otherwise the first
 * `homeImageCount` slides of the folder are used. Cropped with `fit` so nothing is cut.
 */
async function buildCarouselImages(featured, cloudName, aspect) {
  const [widthRatio, heightRatio] = aspect.split("/").map(Number);
  const height = Math.round((CAROUSEL_CROP_WIDTH * heightRatio) / widthRatio);

  const toImage = (publicId, alt) => ({
    src: buildCloudinaryImageUrl(cloudName, publicId, {
      width: CAROUSEL_CROP_WIDTH,
      height,
      crop: "fit",
    }),
    alt,
  });

  if (featured.homeImages?.length) {
    return featured.homeImages.map((publicId) =>
      toImage(publicId, altFromPublicId(publicId)),
    );
  }

  const detail = await fetchFolderGalleryDetail(featured.folder);
  if (!detail.ok) return [];

  return detail.slides
    .slice(0, featured.homeImageCount ?? DEFAULT_CAROUSEL_COUNT)
    .map((slide) => toImage(slide.publicId, slide.alt));
}

async function buildSideGalleries(locale, cloudinaryReady, carouselImages, featured) {
  const resolved = await Promise.all(
    getSideGalleries(SIDE_SLOT_COUNT).map(async (gallery) => {
      const cover = cloudinaryReady ? await fetchFolderGallery(gallery.folder) : null;
      return {
        src: cover?.ok ? cover.coverSrc : null,
        alt: resolveLocalized(gallery.title, locale),
        href: galleryHref(gallery),
      };
    }),
  );

  // With fewer than two other galleries in the manifest, reuse frames from the featured
  // carousel so the mosaic never shows empty slots.
  while (resolved.length < SIDE_SLOT_COUNT) {
    const fallbackIdx = resolved.length + 1;
    resolved.push({
      src:
        carouselImages[fallbackIdx % Math.max(carouselImages.length, 1)]?.src ??
        carouselImages[0]?.src ??
        null,
      alt: resolveLocalized(featured.title, locale),
      href: galleryHref(featured),
    });
  }

  return resolved;
}

/**
 * Everything the homepage Photography panel needs, resolved on the server.
 * Returns null when the manifest has no gallery to feature, so the panel can
 * fall back to an empty state.
 *
 * @param {string} locale
 */
export async function getHomePhotographyData(locale) {
  const featured = getFeaturedGallery();
  if (!featured) return null;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? null;
  const cloudinaryReady = isCloudinaryConfigured();
  const aspect = featured.homeImageAspect ?? DEFAULT_ASPECT;

  const carouselImages = cloudinaryReady
    ? await buildCarouselImages(featured, cloudName, aspect)
    : [];

  const sideGalleries = await buildSideGalleries(
    locale,
    cloudinaryReady,
    carouselImages,
    featured,
  );

  const recent = getRecentGalleries(SIDE_SLOT_COUNT, RECENT_THUMB_COUNT);
  const recentCovers = await Promise.all(
    recent.map(async (gallery) => {
      if (!cloudinaryReady) return null;
      const cover = await fetchFolderGallery(gallery.folder);
      return cover.ok ? cover.coverSrc : null;
    }),
  );

  return {
    aspect,
    detailHref: galleryHref(featured),
    title: resolveLocalized(featured.title, locale),
    description: plainDescription(featured.shortDescription, locale),
    carouselImages,
    sideGalleries,
    recentGalleries: recent.map((gallery, index) => ({
      slug: gallery.slug,
      title: resolveLocalized(gallery.title, locale),
      coverSrc: recentCovers[index],
      href: galleryHref(gallery),
    })),
  };
}
