"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction(formData) {
  const locale = String(formData.get("locale") ?? "en");
  const cookieStore = await cookies();
  cookieStore.delete("archive_session");
  redirect(`/${locale}/archive/login`);
}
