import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getStudioSession } from "@/lib/studio-auth";
import { StudioShell } from "@/components/studio/StudioShell";
import { StudioDataProvider } from "@/components/studio/StudioDataProvider";
import { StudioWorkspace } from "@/components/studio/StudioWorkspace";
import { TimerProvider } from "@/components/time/TimerProvider";
import { logoutAction } from "../actions";
import { ensureInit } from "@/lib/turso";
import { readClients, readProjects, readSettings } from "@/lib/archive";
import { getTimer } from "@/lib/time";

export default async function StudioAppLayout({ children, params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The proxy already redirects signed-out visitors; this check keeps the
  // data below protected even if the proxy matcher changes.
  if (!(await getStudioSession())) {
    redirect(`/${locale}/studio/login`);
  }

  await ensureInit();
  const [projects, clients, settings, timer] = await Promise.all([
    readProjects(),
    readClients(),
    readSettings(),
    getTimer(),
  ]);

  return (
    <div className="h-full">
      {/* The timer is shared by both tabs (badge on the Time tab). */}
      <TimerProvider initialTimer={timer}>
        <StudioShell locale={locale} logoutAction={logoutAction}>
          <StudioDataProvider
            initialProjects={projects}
            initialClients={clients}
            initialSettings={settings}
          >
            <StudioWorkspace />
            {/* Keep route children for RSC/metadata; UI is keep-alive workspace */}
            <div className="hidden" aria-hidden>
              {children}
            </div>
          </StudioDataProvider>
        </StudioShell>
      </TimerProvider>
    </div>
  );
}
