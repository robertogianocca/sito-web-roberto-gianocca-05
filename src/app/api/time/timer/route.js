import { NextResponse } from "next/server";
import { withStudioAuth } from "@/lib/studio-auth";
import { ensureInit } from "@/lib/turso";
import {
  getTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  updateRunningTimer,
  checkAndCompletePomodoro,
} from "@/lib/time";
import { parseJsonBody, timerActionSchema } from "@/lib/studio/schemas";

/** Read-only: completing a Pomodoro goes through POST `checkPomodoro`. */
export const GET = withStudioAuth(async () => {
  await ensureInit();
  const timer = await getTimer();
  return NextResponse.json({ timer, pomodoroCompleted: false, entry: null });
});

/**
 * Timer actions. A state conflict (already running, already stopped, …)
 * is answered 409 by withStudioAuth (TimerConflictError).
 */
export const POST = withStudioAuth(async (request) => {
  const body = await parseJsonBody(request, timerActionSchema);
  await ensureInit();

  switch (body.action) {
    case "start": {
      const timer = await startTimer({
        projectId: body.projectId ?? "",
        description: body.description ?? "",
        pomodoroEnabled: Boolean(body.pomodoroEnabled),
        pomodoroMinutes: body.pomodoroMinutes,
      });
      return NextResponse.json({ timer }, { status: 201 });
    }
    case "pause":
      return NextResponse.json({ timer: await pauseTimer() });
    case "resume":
      return NextResponse.json({ timer: await resumeTimer() });
    case "stop":
      return NextResponse.json(
        await stopTimer({ source: body.source, description: body.description })
      );
    case "update": {
      const { action: _action, ...patch } = body;
      return NextResponse.json({ timer: await updateRunningTimer(patch) });
    }
    case "checkPomodoro": {
      const result = await checkAndCompletePomodoro({ description: body.description });
      return NextResponse.json({
        timer: result.timer,
        pomodoroCompleted: result.completed,
        entry: result.entry,
      });
    }
  }
});
