"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STUDIO_SESSION_COOKIE } from "@/lib/studio-auth";

export async function loginAction(prevState, formData) {
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "en");

  const expectedPassword = process.env.ARCHIVE_PASSWORD;
  const sessionSecret = process.env.ARCHIVE_SESSION_SECRET;

  if (!expectedPassword || !sessionSecret) {
    return {
      error:
        "Studio not configured. Add ARCHIVE_PASSWORD and ARCHIVE_SESSION_SECRET to .env.local.",
    };
  }

  if (password !== expectedPassword) {
    return { error: "Invalid password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(STUDIO_SESSION_COOKIE, sessionSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  redirect(`/${locale}/studio/archive`);
}
