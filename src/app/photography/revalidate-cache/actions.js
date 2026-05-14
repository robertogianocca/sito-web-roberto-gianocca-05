"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { PHOTOGRAPHY_CLOUDINARY_CACHE_TAG } from "../../../lib/cloudinary-server";

/**
 * Rigenera cache dati Cloudinary e pagine statiche sotto /photography.
 * Richiede `REVALIDATION_SECRET` in .env e lo stesso valore inviato nel form (campo secret).
 */
export async function revalidatePhotographyCaches(formData) {
  const secret = String(formData.get("secret") ?? "");
  const expected = process.env.REVALIDATION_SECRET;

  if (!expected || secret !== expected) {
    redirect("/photography/revalidate-cache?error=1");
  }

  revalidateTag(PHOTOGRAPHY_CLOUDINARY_CACHE_TAG);
  revalidatePath("/photography", "layout");
  redirect("/photography/revalidate-cache?ok=1");
}
