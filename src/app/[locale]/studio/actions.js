"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STUDIO_SESSION_COOKIE } from "@/lib/studio-auth";

export async function logoutAction(formData) {
  const locale = String(formData.get("locale") ?? "en");
  const cookieStore = await cookies();
  cookieStore.delete(STUDIO_SESSION_COOKIE);
  redirect(`/${locale}/studio/login`);
}
