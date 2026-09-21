import { setRequestLocale } from "next-intl/server";
import { ArchiveShell } from "@/components/archive/ArchiveShell";
import { readClients, readSettings } from "@/lib/archive";
import { ensureInit } from "@/lib/turso";

export async function generateMetadata() {
  return {
    title: "Studio — Archive",
    robots: { index: false, follow: false },
  };
}

export default async function StudioArchivePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  await ensureInit();
  const [clients, settings] = await Promise.all([readClients(), readSettings()]);

  return (
    <ArchiveShell
      initialSettings={settings}
      initialClients={clients}
    />
  );
}
