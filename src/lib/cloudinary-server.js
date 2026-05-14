import { unstable_cache } from "next/cache";
import cloudinary from "cloudinary";

/**
 * Tag per `revalidateTag`: invalida la cache dati Cloudinary senza scadenza automatica.
 * Usa la pagina `/photography/revalidate-cache` dopo modifiche su Cloudinary.
 */
export const PHOTOGRAPHY_CLOUDINARY_CACHE_TAG = "photography-cloudinary";

/** Ultimo segmento del public_id deve essere esattamente questo (es. `…/Photography/cover` o `cover`). */
const COVER_BASENAME = "cover";

function readEnv() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };
}

export function isCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = readEnv();
  return Boolean(cloudName && apiKey && apiSecret);
}

function configureCloudinary() {
  const { cloudName, apiKey, apiSecret } = readEnv();
  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }
  cloudinary.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  return cloudName;
}

/**
 * URL di delivery con trasformazioni stabili (f_auto, q_auto).
 * @param {string} cloudName
 * @param {string} publicId
 * @param {{ width: number, height: number, crop?: string }} opts
 */
export function buildCloudinaryImageUrl(cloudName, publicId, opts) {
  const { width, height, crop = "fill" } = opts;
  const transforms = ["f_auto", "q_auto", `w_${width}`, `h_${height}`, `c_${crop}`].join(
    ",",
  );
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId}`;
}

function slideAltFromPublicId(publicId) {
  const base = publicId.split("/").pop() ?? publicId;
  return base.replace(/[-_]/g, " ").trim() || "Fotografia";
}

function publicIdLastSegment(publicId) {
  const parts = publicId.split("/");
  return parts.length > 0 ? parts[parts.length - 1] : publicId;
}

function isCoverPublicId(publicId) {
  return publicIdLastSegment(publicId) === COVER_BASENAME;
}

async function fetchFolderAssetsUncached(folder) {
  const cloudName = configureCloudinary();
  if (!cloudName) {
    return { ok: false, reason: "missing_env" };
  }

  const escapedFolder = folder.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const result = await cloudinary.v2.search
    .expression(`resource_type:image AND folder:"${escapedFolder}"`)
    .max_results(500)
    .sort_by("public_id", "asc")
    .execute();

  const resources = result.resources ?? [];

  if (resources.length === 0) {
    return {
      ok: false,
      reason: "empty_folder",
      folder,
    };
  }

  const coverResource = resources.find((r) => isCoverPublicId(r.public_id));
  const coverSrc = coverResource
    ? buildCloudinaryImageUrl(cloudName, coverResource.public_id, {
        width: 800,
        height: 600,
        crop: "fill",
      })
    : null;

  const slideResources = resources.filter((r) => !isCoverPublicId(r.public_id));
  const slides = slideResources.map((r) => ({
    publicId: r.public_id,
    src: buildCloudinaryImageUrl(cloudName, r.public_id, {
      width: 1920,
      height: 1280,
      crop: "limit",
    }),
    thumbSrc: buildCloudinaryImageUrl(cloudName, r.public_id, {
      width: 320,
      height: 240,
      crop: "limit",
    }),
    alt: slideAltFromPublicId(r.public_id),
  }));

  return {
    ok: true,
    cloudName,
    coverSrc,
    coverPublicId: coverResource?.public_id ?? null,
    slides,
  };
}

export const fetchFolderAssets = unstable_cache(fetchFolderAssetsUncached, ["cloudinary-folder-assets-v5"], {
  revalidate: false,
  tags: [PHOTOGRAPHY_CLOUDINARY_CACHE_TAG],
});

/**
 * Dati lista: cover + conteggio slide (stessa Search in cache di {@link fetchFolderGalleryDetail}).
 */
export async function fetchFolderGallery(folder) {
  const data = await fetchFolderAssets(folder);
  if (!data.ok) {
    return data;
  }
  return {
    ok: true,
    coverSrc: data.coverSrc,
    coverPublicId: data.coverPublicId,
    slideCount: data.slides.length,
  };
}

/**
 * Dettaglio galleria: cover opzionale + slide (eventuale cover esclusa dal carosello).
 */
export async function fetchFolderGalleryDetail(folder) {
  return fetchFolderAssets(folder);
}

/**
 * Fetch Admin singolo per verifica credenziali / public_id (non cached: utile in dev).
 * @param {string} publicId es. "02_olvllg" (senza cartella se l’asset è in root)
 * @returns {Promise<
 *   | { ok: true; cloudName: string; publicId: string; previewSrc: string; width?: number; height?: number; format?: string; bytes?: number }
 *   | { ok: false; reason: string; message?: string }
 * >}
 */
export async function fetchCloudinaryResourceProbe(publicId) {
  const cloudName = configureCloudinary();
  if (!cloudName) {
    return { ok: false, reason: "missing_env" };
  }

  try {
    const resource = await cloudinary.v2.api.resource(publicId, { resource_type: "image" });
    const previewSrc = buildCloudinaryImageUrl(cloudName, resource.public_id, {
      width: 480,
      height: 360,
      crop: "limit",
    });

    return {
      ok: true,
      cloudName,
      publicId: resource.public_id,
      previewSrc,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      bytes: resource.bytes,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: "api_error", message };
  }
}
