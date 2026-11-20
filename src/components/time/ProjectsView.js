"use client";

import { useMemo, useState } from "react";
import {
  formatDuration,
  lastDaysRange,
  localDateRangeParams,
} from "@/lib/timeFormat";
import { groupByProject } from "./projectGroups";
import { DateRangeFields } from "./DateRangeFields";
import { DescriptionGroup } from "./projects/DescriptionGroup";
import { ExpandToggle } from "./projects/ExpandToggle";
import { useJsonResource } from "@/components/studio/hooks/useJsonResource";
import { apiFetch } from "@/components/studio/api";
import { ErrorBanner } from "@/components/studio/ui/ErrorBanner";

export function ProjectsView({
  projectMap,
  timerActive,
  onRestart,
  onEdit,
  onDelete,
  onChanged,
}) {
  const [from, setFrom] = useState(() => lastDaysRange().from);
  const [to, setTo] = useState(() => lastDaysRange().to);
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());

  const {
    data,
    loading,
    error: loadError,
  } = useJsonResource(`/api/time/entries?${localDateRangeParams(from, to)}`, {
    reloadKey,
    errorMessage: "Failed to load entries.",
  });
  const entries = useMemo(() => data?.entries ?? [], [data]);
  const error = actionError ?? loadError;

  const groups = useMemo(() => groupByProject(entries, projectMap), [entries, projectMap]);

  function toggle(key) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleRename(projectId, group, nextName) {
    setActionError(null);
    try {
      await apiFetch("/api/time/entries", {
        method: "PATCH",
        body: { projectId, from: group.key, to: nextName },
        fallbackMessage: "Failed to rename description.",
      });
    } catch (err) {
      setActionError(err.message);
      return false;
    }
    setReloadKey((k) => k + 1);
    onChanged?.();
    return true;
  }

  const grandTotal = groups.reduce((s, g) => s + g.totalSeconds, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-sm font-medium text-zinc-700">Projects</h2>
        <DateRangeFields from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}

      {!loading && (
        <>
          <p className="font-mono text-sm text-zinc-600">
            Total{" "}
            <span className="font-semibold text-foreground">
              {formatDuration(grandTotal)}
            </span>
            <span className="text-zinc-400">
              {" "}
              · {groups.length} project{groups.length === 1 ? "" : "s"}
            </span>
          </p>

          {groups.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400">
              No time logged in this range.
            </p>
          ) : (
            <ul className="space-y-2">
              {groups.map((g) => {
                const key = g.key;
                const isOpen = expanded.has(key);
                return (
                  <li
                    key={key}
                    className="overflow-hidden rounded-xl border border-zinc-200"
                  >
                    <ExpandToggle
                      isOpen={isOpen}
                      onClick={() => toggle(key)}
                      className="px-4 py-3 hover:bg-zinc-50"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {g.label}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {g.descriptions.length} task
                        {g.descriptions.length === 1 ? "" : "s"}
                      </span>
                      <span className="font-mono text-sm font-semibold tabular-nums text-zinc-800">
                        {formatDuration(g.totalSeconds)}
                      </span>
                    </ExpandToggle>
                    {isOpen && (
                      <ul className="divide-y divide-zinc-100 border-t border-zinc-100 bg-zinc-50/50">
                        {g.descriptions.map((d) => {
                          const descKey = `${key}::${d.key}`;
                          return (
                            <DescriptionGroup
                              key={descKey}
                              group={d}
                              isOpen={expanded.has(descKey)}
                              onToggle={() => toggle(descKey)}
                              timerActive={timerActive}
                              onRestart={(description) =>
                                onRestart({
                                  projectId: g.projectId,
                                  description,
                                })
                              }
                              onRename={(group, nextName) =>
                                handleRename(g.projectId, group, nextName)
                              }
                              onEdit={onEdit}
                              onDelete={onDelete}
                            />
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
