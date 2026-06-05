"use server";

import crypto from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { PHOTOGRAPHY_CLOUDINARY_CACHE_TAG } from "@/lib/cloudinary-server";

import {
  REVALIDATION_OK_VALUE,
  REVALIDATION_ERROR_VALUE,
} from "./constants";

function safeCompare(a, b) {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function revalidatePhotographyCaches(formData) {
  const locale = await getLocale();
  const secret = String(formData.get("secret") ?? "");
  const expected = process.env.REVALIDATION_SECRET;

  if (!expected || !safeCompare(secret, expected)) {
    redirect(`/${locale}/photography/revalidate-cache?error=${REVALIDATION_ERROR_VALUE}`);
  }

  revalidateTag(PHOTOGRAPHY_CLOUDINARY_CACHE_TAG);
  revalidatePath(`/${locale}/photography`, "layout");
  redirect(`/${locale}/photography/revalidate-cache?ok=${REVALIDATION_OK_VALUE}`);
}
