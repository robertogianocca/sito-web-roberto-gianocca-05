import { setRequestLocale } from "next-intl/server";
import { TimeShell } from "@/components/time/TimeShell";
import { readProjects } from "@/lib/archive";
import { ensureInit } from "@/lib/turso";
import { getActivityTypes, getTimer, getTodayTotalSeconds } from "@/lib/time";

export async function generateMetadata() {
  return {
    title: "Studio — Time",
    robots: { index: false, follow: false },
  };
}

export default async function StudioTimePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  await ensureInit();
  const [projects, activityTypes, timer, todayTotalSeconds] =
    await Promise.all([
      readProjects(),
      getActivityTypes(),
      getTimer(),
      getTodayTotalSeconds(),
    ]);

  return (
    <TimeShell
      locale={locale}
      initialProjects={projects}
      initialActivityTypes={activityTypes}
      initialTimer={timer}
      initialTodayTotalSeconds={todayTotalSeconds}
    />
  );
}
