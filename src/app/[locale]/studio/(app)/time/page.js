import { setRequestLocale } from "next-intl/server";

export async function generateMetadata() {
  return {
    title: "Studio — Time",
    robots: { index: false, follow: false },
  };
}

export default async function StudioTimePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return null;
}
