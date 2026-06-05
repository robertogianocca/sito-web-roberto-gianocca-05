import { notFound } from "next/navigation";
import { GallerySlideshow } from "../../../components/photography/GallerySlideshow.client";
import { ErrorPanel } from "../../../components/shared/ErrorPanel";
import {
  getPhotographyGalleryBySlug,
  getPhotographyGalleryStaticParams,
} from "../../../data/photography-galleries";
import {
  fetchFolderGalleryDetail,
  isCloudinaryConfigured,
} from "../../../lib/cloudinary-server";
import { plainTextFromMarkdown } from "../../../lib/plain-text-from-markdown";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPhotographyGalleryStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const gallery = getPhotographyGalleryBySlug(slug);
  if (!gallery) {
    return { title: "Galleria | Roberto Gianocca" };
  }
  return {
    title: `${gallery.title} | Photography | Roberto Gianocca`,
    description: plainTextFromMarkdown(gallery.shortDescription),
  };
}

const BACK = { href: "/photography", label: "Photography" };

export default async function PhotographyGalleryPage({ params }) {
  const { slug } = await params;
  const gallery = getPhotographyGalleryBySlug(slug);
  if (!gallery) {
    notFound();
  }

  if (!isCloudinaryConfigured()) {
    return (
      <ErrorPanel
        backHref={BACK.href}
        backLabel={BACK.label}
        title="Cloudinary non configurato"
        body="Imposta CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET in .env.local."
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
        backHref={BACK.href}
        backLabel={BACK.label}
        title="Errore durante il caricamento"
        body={message}
      />
    );
  }

  if (!detail.ok) {
    if (detail.reason === "empty_folder") {
      return (
        <ErrorPanel
          backHref={BACK.href}
          backLabel={BACK.label}
          title="Cartella senza immagini"
          body="Non ci sono immagini in questa cartella su Cloudinary, oppure il valore `folder` nel manifest non coincide con il percorso reale."
        />
      );
    }
    const fallback =
      "Non è stato possibile leggere le immagini da Cloudinary. Controlla cartella e permessi API.";
    const body =
      detail.reason === "api_error" && "message" in detail && detail.message
        ? String(detail.message)
        : fallback;
    return (
      <ErrorPanel
        backHref={BACK.href}
        backLabel={BACK.label}
        title="Galleria non disponibile"
        body={body}
      />
    );
  }

  if (detail.slides.length === 0) {
    return (
      <ErrorPanel
        backHref={BACK.href}
        backLabel={BACK.label}
        title="Nessuna immagine nella galleria"
        body={`Nella cartella c'è solo l'eventuale copertina (nome "cover") e nessun'altra foto, oppure la cartella non contiene immagini da mostrare.`}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col md:overflow-hidden">
      <GallerySlideshow
        key={gallery.slug}
        title={gallery.title}
        description={gallery.shortDescription}
        slides={detail.slides}
        backHref="/photography"
      />
    </div>
  );
}
