import { setRequestLocale } from "next-intl/server";
import { ArchiveShell } from "@/components/archive/ArchiveShell";
import { ARCHIVE_DRIVES, BACKUP_DRIVES, PROJECT_TYPES } from "@/data/archive/config";
import { readClients } from "@/lib/archive";
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

  const clients = await readClients();

  return (
    <div className="h-full">
      <ArchiveShell
        archiveDrives={ARCHIVE_DRIVES}
        backupDrives={BACKUP_DRIVES}
        projectTypes={PROJECT_TYPES}
        initialClients={clients}
        locale={locale}
        logoutAction={logoutAction}
      />
    </div>
  );
}
