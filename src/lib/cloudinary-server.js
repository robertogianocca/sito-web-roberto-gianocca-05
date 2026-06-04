import { unstable_cache } from "next/cache";
import cloudinary from "cloudinary";

/**
 * Tag per `revalidateTag`: invalida la cache dati Cloudinary senza scadenza automatica.
 * Docs: docs/cloudinary-photography.md — rivalidazione: /photography/revalidate-cache
 */
export const PHOTOGRAPHY_CLOUDINARY_CACHE_TAG = "photography-cloudinary";

/** Ultimo segmento del public_id deve essere esattamente questo (es. `…/Photography/cover` o `cover`). */
const COVER_BASENAME = "cover";

const RESOURCES_MAX = 500;

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

/**
 * Lista immagini per prefisso cartella (stesso modello di immagina-website-03:
 * Admin Resources API + fetch force-cache), con paginazione next_cursor.
 * @param {string} cloudName
 * @param {string} folder es. "Roberto Gianocca/Portfolio/Photography/nome-galleria" (senza slash iniziale)
 * @param {string} apiKey
 * @param {string} apiSecret
 */
async function fetchAllResourcesByPrefix(cloudName, folder, apiKey, apiSecret) {
  const prefix = folder.endsWith("/") ? folder : `${folder}/`;
  const auth = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
  const all = [];
  let nextCursor;

  do {
    const params = new URLSearchParams({
      type: "upload",
      prefix,
      max_results: String(RESOURCES_MAX),
      metadata: "true",
    });
    if (nextCursor) {
      params.set("next_cursor", nextCursor);
    }
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${params.toString()}`;
    const response = await fetch(url, {
      headers: { Authorization: auth },
      cache: "force-cache",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Cloudinary resources ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    const batch = data.resources ?? [];
    all.push(...batch);
    nextCursor = typeof data.next_cursor === "string" ? data.next_cursor : undefined;
  } while (nextCursor);

  return all;
}

function deliveryUrlFromResource(r, cloudName) {
  if (typeof r.secure_url === "string" && r.secure_url.length > 0) {
    return r.secure_url;
  }
  if (typeof r.url === "string" && r.url.length > 0) {
    return r.url;
  }
  return buildCloudinaryImageUrl(cloudName, r.public_id, {
    width: 1920,
    height: 1280,
    crop: "limit",
  });
}

/**
 * Solo asset con public_id direttamente sotto `folderExact` (un segmento dopo il path).
 * @param {Array<Record<string, unknown>>} resources
 * @param {string} folderExact
 */
function filterResourcesToDirectFolder(resources, folderExact) {
  return resources.filter((r) => {
    const pid = String(r.public_id ?? "");
    if (pid.startsWith(`${folderExact}/`)) {
      const rest = pid.slice(folderExact.length + 1);
      if (!rest.includes("/")) {
        return true;
      }
    }
    if (typeof r.folder === "string" && r.folder.length > 0 && r.folder === folderExact) {
      return true;
    }
    return false;
  });
}

/**
 * Search API: stesso criterio cartella che funzionava prima del passaggio a Resources.
 * Usato come fallback se l’Admin Resources list non restituisce risorse utilizzabili.
 */
async function fetchImagesBySearch(folder) {
  const escapedFolder = folder.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const result = await cloudinary.v2.search
    .expression(`resource_type:image AND folder:"${escapedFolder}"`)
    .max_results(500)
    .sort_by("public_id", "asc")
    .execute();
  return result.resources ?? [];
}

async function fetchFolderAssetsUncached(folder) {
  const { cloudName, apiKey, apiSecret } = readEnv();
  if (!cloudName || !apiKey || !apiSecret) {
    return { ok: false, reason: "missing_env" };
  }

  configureCloudinary();

  const folderExact = folder.replace(/\/$/, "");

  let resources = [];
  let resourcesFetchError = null;
  try {
    resources = await fetchAllResourcesByPrefix(cloudName, folder, apiKey, apiSecret);
  } catch (err) {
    resourcesFetchError = err instanceof Error ? err.message : String(err);
  }

  let working = filterResourcesToDirectFolder(resources, folderExact);

  if (working.length === 0) {
    try {
      const viaSearch = await fetchImagesBySearch(folder);
      if (viaSearch.length > 0) {
        working = viaSearch;
      }
    } catch (searchErr) {
      const searchMsg = searchErr instanceof Error ? searchErr.message : String(searchErr);
      if (resourcesFetchError) {
        return {
          ok: false,
          reason: "api_error",
          message: `${resourcesFetchError} | search: ${searchMsg}`,
          folder,
        };
      }
      return { ok: false, reason: "api_error", message: searchMsg, folder };
    }
  }

  working.sort((a, b) => String(a.public_id).localeCompare(String(b.public_id)));

  if (working.length === 0) {
    if (resourcesFetchError) {
      return { ok: false, reason: "api_error", message: resourcesFetchError, folder };
    }
    return {
      ok: false,
      reason: "empty_folder",
      folder,
    };
  }

  const coverResource = working.find((r) => isCoverPublicId(r.public_id));
  const coverSrc = coverResource
    ? buildCloudinaryImageUrl(cloudName, coverResource.public_id, {
        width: 800,
        height: 600,
        crop: "fill",
      })
    : null;

  const slideResources = working.filter((r) => !isCoverPublicId(r.public_id));
  const slides = slideResources.map((r) => {
    const intrinsicW = typeof r.width === "number" && r.width > 0 ? r.width : 1920;
    const intrinsicH = typeof r.height === "number" && r.height > 0 ? r.height : 1280;
    const src = deliveryUrlFromResource(r, cloudName);

    return {
      publicId: r.public_id,
      width: intrinsicW,
      height: intrinsicH,
      src,
      alt: slideAltFromPublicId(r.public_id),
    };
  });

  return {
    ok: true,
    cloudName,
    coverSrc,
    coverPublicId: coverResource?.public_id ?? null,
    slides,
  };
}

export const fetchFolderAssets = unstable_cache(fetchFolderAssetsUncached, ["cloudinary-folder-assets-v11"], {
  revalidate: false,
  tags: [PHOTOGRAPHY_CLOUDINARY_CACHE_TAG],
});

/**
 * Dati lista: cover + conteggio slide (Resources + fallback Search, vedi {@link fetchFolderAssetsUncached}).
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
