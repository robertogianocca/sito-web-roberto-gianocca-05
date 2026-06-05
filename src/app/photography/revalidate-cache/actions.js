"use server";

import crypto from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { PHOTOGRAPHY_CLOUDINARY_CACHE_TAG } from "../../../lib/cloudinary-server";

/** Shared param values used by both the action (redirect) and the page (read). */
export const REVALIDATION_OK_VALUE = "1";
export const REVALIDATION_ERROR_VALUE = "1";

/**
 * Constant-time comparison via SHA-256 hashes — both digests are always 32 bytes,
 * so timingSafeEqual never throws and no length information leaks.
 */
function safeCompare(a, b) {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Rigenera cache dati Cloudinary e pagine statiche sotto /photography.
 * Richiede la variabile d'ambiente del segreto e lo stesso valore inviato nel form.
 */
export async function revalidatePhotographyCaches(formData) {
  const secret = String(formData.get("secret") ?? "");
  const expected = process.env.REVALIDATION_SECRET;

  if (!expected || !safeCompare(secret, expected)) {
    redirect(`/photography/revalidate-cache?error=${REVALIDATION_ERROR_VALUE}`);
  }

  revalidateTag(PHOTOGRAPHY_CLOUDINARY_CACHE_TAG);
  revalidatePath("/photography", "layout");
  redirect(`/photography/revalidate-cache?ok=${REVALIDATION_OK_VALUE}`);
}
