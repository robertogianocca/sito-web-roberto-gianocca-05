"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { STUDIO_SESSION_COOKIE } from "@/lib/studio-auth";

export async function logoutAction(formData) {
  const rawLocale = String(formData.get("locale") ?? "");
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  const cookieStore = await cookies();
  cookieStore.delete(STUDIO_SESSION_COOKIE);
  redirect(`/${locale}/studio/login`);
}
