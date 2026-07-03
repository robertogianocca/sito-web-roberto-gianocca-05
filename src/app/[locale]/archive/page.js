import { setRequestLocale } from "next-intl/server";
import { ArchiveShell } from "@/components/archive/ArchiveShell";
import { readClients, readSettings } from "@/lib/archive";
import { ensureInit } from "@/lib/turso";
import { logoutAction } from "./actions";

export async function generateMetadata() {
  return {
    title: "Archive",
    robots: { index: false, follow: false },
  };
}

export default async function ArchivePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  await ensureInit();
  const [clients, settings] = await Promise.all([readClients(), readSettings()]);

  return (
    <div className="h-full">
      <ArchiveShell
        initialSettings={settings}
        initialClients={clients}
        locale={locale}
        logoutAction={logoutAction}
      />
    </div>
  );
}
