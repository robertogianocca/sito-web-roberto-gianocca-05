"use client";

import { projectLabel } from "./projectLabel";
import { RestartButton } from "./RestartButton";

const RECENT_LIMIT = 5;

function formatLastUsed(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - day) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function RecentTasks({ tasks, projectMap, timerActive, onRestart }) {
  const recent = tasks.slice(0, RECENT_LIMIT);
  if (recent.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-zinc-700">Recent</h2>
      <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
        {recent.map((task) => (
          <li
            key={`${task.projectId}::${task.description}`}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50"
          >
            <RestartButton
              timerActive={timerActive}
              onClick={() => onRestart(task)}
              label="Start timer for this task"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {projectLabel(projectMap.get(task.projectId))}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {task.description || "No description"}
              </p>
            </div>
            <span className="shrink-0 text-xs text-zinc-400">
              {formatLastUsed(task.lastUsedAt)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
