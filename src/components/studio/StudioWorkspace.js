"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { ArchiveShell } from "@/components/archive/ArchiveShell";
import { TimeShell } from "@/components/time/TimeShell";

function tabFromPath(pathname) {
  if (pathname === "/studio/time" || pathname.startsWith("/studio/time/")) {
    return "time";
  }
  return "archive";
}

export function StudioWorkspace({
  locale,
  initialTimer = null,
  initialTodayTotalSeconds = 0,
}) {
  const pathname = usePathname();
  const activeTab = tabFromPath(pathname);

  const [mountedArchive, setMountedArchive] = useState(
    () => activeTab === "archive"
  );
  const [mountedTime, setMountedTime] = useState(() => activeTab === "time");

  useEffect(() => {
    if (activeTab === "archive") setMountedArchive(true);
    if (activeTab === "time") setMountedTime(true);
  }, [activeTab]);

  return (
    <div className="relative h-full min-h-0">
      {mountedArchive ? (
        <div
          className={
            activeTab === "archive"
              ? "h-full min-h-0"
              : "pointer-events-none invisible absolute inset-0 h-full min-h-0 overflow-hidden"
          }
          aria-hidden={activeTab !== "archive"}
          inert={activeTab !== "archive" ? true : undefined}
        >
          <ArchiveShell />
        </div>
      ) : null}

      {mountedTime ? (
        <div
          className={
            activeTab === "time"
              ? "h-full min-h-0"
              : "pointer-events-none invisible absolute inset-0 h-full min-h-0 overflow-hidden"
          }
          aria-hidden={activeTab !== "time"}
          inert={activeTab !== "time" ? true : undefined}
        >
          <TimeShell
            locale={locale}
            active={activeTab === "time"}
            initialTimer={initialTimer}
            initialTodayTotalSeconds={initialTodayTotalSeconds}
          />
        </div>
      ) : null}
    </div>
  );
}
