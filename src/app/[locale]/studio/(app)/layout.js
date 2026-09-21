import { setRequestLocale } from "next-intl/server";
import { StudioShell } from "@/components/studio/StudioShell";
import { StudioDataProvider } from "@/components/studio/StudioDataProvider";
import { StudioWorkspace } from "@/components/studio/StudioWorkspace";
import { logoutAction } from "../actions";
import { ensureInit } from "@/lib/turso";
import { readClients, readProjects, readSettings } from "@/lib/archive";
import {
  getActivityTypes,
  getTimer,
  getTodayTotalSeconds,
} from "@/lib/time";

export default async function StudioAppLayout({ children, params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  await ensureInit();
  const [projects, clients, settings, activityTypes, timer, todayTotalSeconds] =
    await Promise.all([
      readProjects(),
      readClients(),
      readSettings(),
      getActivityTypes(),
      getTimer(),
      getTodayTotalSeconds(),
    ]);

  return (
    <div className="h-full">
      <StudioShell locale={locale} logoutAction={logoutAction}>
        <StudioDataProvider
          initialProjects={projects}
          initialClients={clients}
          initialSettings={settings}
          initialActivityTypes={activityTypes}
        >
          <StudioWorkspace
            locale={locale}
            initialTimer={timer}
            initialTodayTotalSeconds={todayTotalSeconds}
          />
          {/* Keep route children for RSC/metadata; UI is keep-alive workspace */}
          <div className="hidden" aria-hidden>
            {children}
          </div>
        </StudioDataProvider>
      </StudioShell>
    </div>
  );
}
