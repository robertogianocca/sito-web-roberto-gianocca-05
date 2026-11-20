import { NextResponse } from "next/server";
import { isStudioAuthenticated, unauthorizedJson } from "@/lib/studio-auth";
import { ensureInit } from "@/lib/turso";
import {
  getTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  updateRunningTimer,
  checkAndCompletePomodoro,
  TimerConflictError,
} from "@/lib/time";

/** Read-only: completing a Pomodoro goes through POST `checkPomodoro`. */
export async function GET(request) {
  if (!isStudioAuthenticated(request)) return unauthorizedJson();
  await ensureInit();

  const timer = await getTimer();
  return NextResponse.json({ timer, pomodoroCompleted: false, entry: null });
}

function optionalString(value) {
  return typeof value === "string" ? value : undefined;
}

export async function POST(request) {
  if (!isStudioAuthenticated(request)) return unauthorizedJson();
  await ensureInit();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action;
  try {
    if (action === "start") {
      const timer = await startTimer({
        projectId: body.projectId ?? "",
        description: body.description ?? "",
        pomodoroEnabled: Boolean(body.pomodoroEnabled),
        pomodoroMinutes: body.pomodoroMinutes,
      });
      return NextResponse.json({ timer }, { status: 201 });
    }

    if (action === "pause") {
      const timer = await pauseTimer();
      return NextResponse.json({ timer });
    }

    if (action === "resume") {
      const timer = await resumeTimer();
      return NextResponse.json({ timer });
    }

    if (action === "stop") {
      const result = await stopTimer({
        source: body.source,
        description: optionalString(body.description),
      });
      return NextResponse.json(result);
    }

    if (action === "update") {
      const timer = await updateRunningTimer(body);
      return NextResponse.json({ timer });
    }

    if (action === "checkPomodoro") {
      const result = await checkAndCompletePomodoro({
        description: optionalString(body.description),
      });
      return NextResponse.json({
        timer: result.timer,
        pomodoroCompleted: result.completed,
        entry: result.entry,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    if (err instanceof TimerConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Timer action failed", action, err);
    return NextResponse.json({ error: "Timer error" }, { status: 500 });
  }
}
