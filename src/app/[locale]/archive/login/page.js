import { redirect } from "next/navigation";

export async function generateMetadata() {
  return {
    title: "Archive — Login",
    robots: { index: false, follow: false },
  };
}

export default async function ArchiveLoginRedirectPage({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/studio/login`);
}
