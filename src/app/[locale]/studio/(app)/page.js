import { redirect } from "next/navigation";

export async function generateMetadata() {
  return {
    title: "Studio",
    robots: { index: false, follow: false },
  };
}

export default async function StudioIndexPage({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/studio/archive`);
}
