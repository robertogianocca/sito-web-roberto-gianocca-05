import { setRequestLocale } from "next-intl/server";

export async function generateMetadata() {
  return {
    title: "Studio — Archive",
    robots: { index: false, follow: false },
  };
}

export default async function StudioArchivePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return null;
}
