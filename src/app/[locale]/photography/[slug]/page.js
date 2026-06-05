import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { GallerySlideshow } from "@/components/photography/GallerySlideshow.client";
import { ErrorPanel } from "@/components/shared/ErrorPanel";
import {
  getPhotographyGalleryBySlug,
  getPhotographyGalleryStaticParams,
} from "@/data/photography-galleries";
import {
  fetchFolderGalleryDetail,
  isCloudinaryConfigured,
} from "@/lib/cloudinary-server";
import { plainTextFromMarkdown } from "@/lib/plain-text-from-markdown";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPhotographyGalleryStaticParams();
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const gallery = getPhotographyGalleryBySlug(slug);
  if (!gallery) {
    return { title: "Gallery | Roberto Gianocca" };
  }
  const title =
    typeof gallery.title === "object"
      ? (gallery.title[locale] ?? gallery.title.en)
      : gallery.title;
  const description =
    typeof gallery.shortDescription === "object"
      ? (gallery.shortDescription[locale] ?? gallery.shortDescription.en)
      : gallery.shortDescription;
  return {
    title: `${title} | Photography | Roberto Gianocca`,
    description: plainTextFromMarkdown(description),
    alternates: buildAlternates(`/photography/${slug}`, routing),
  };
}

export default async function PhotographyGalleryPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Photography");
  const gallery = getPhotographyGalleryBySlug(slug);
  if (!gallery) {
    notFound();
  }

  const backHref = "/photography";
  const backLabel = "Photography";

  const title =
    typeof gallery.title === "object"
      ? (gallery.title[locale] ?? gallery.title.en)
      : gallery.title;
  const description =
    typeof gallery.shortDescription === "object"
      ? (gallery.shortDescription[locale] ?? gallery.shortDescription.en)
      : gallery.shortDescription;

  if (!isCloudinaryConfigured()) {
    return (
      <ErrorPanel
        backHref={backHref}
        backLabel={backLabel}
        title={t("errorCloudinaryNotConfiguredTitle")}
        body={t("errorCloudinaryNotConfiguredBody")}
      />
    );
  }

  let detail;
  try {
    detail = await fetchFolderGalleryDetail(gallery.folder);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <ErrorPanel
        backHref={backHref}
        backLabel={backLabel}
        title={t("errorLoadTitle")}
        body={message}
      />
    );
  }

  if (!detail.ok) {
    if (detail.reason === "empty_folder") {
      return (
        <ErrorPanel
          backHref={backHref}
          backLabel={backLabel}
          title={t("errorEmptyFolderTitle")}
          body={t("errorEmptyFolderBody")}
        />
      );
    }
    const fallback = t("errorGalleryUnavailableBody");
    const body =
      detail.reason === "api_error" && "message" in detail && detail.message
        ? String(detail.message)
        : fallback;
    return (
      <ErrorPanel
        backHref={backHref}
        backLabel={backLabel}
        title={t("errorGalleryUnavailableTitle")}
        body={body}
      />
    );
  }

  if (detail.slides.length === 0) {
    return (
      <ErrorPanel
        backHref={backHref}
        backLabel={backLabel}
        title={t("errorNoImagesTitle")}
        body={t("errorNoImagesBody")}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col md:overflow-hidden">
      <GallerySlideshow
        key={gallery.slug}
        title={title}
        description={description}
        slides={detail.slides}
        backHref="/photography"
      />
    </div>
  );
}
