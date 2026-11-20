"use client";

import { useState } from "react";
import {
  formatDuration,
  formatDurationHours,
  lastDaysRange,
  localDateRangeParams,
} from "@/lib/timeFormat";
import { useJsonResource } from "@/components/studio/hooks/useJsonResource";
import { ErrorBanner } from "@/components/studio/ui/ErrorBanner";

export function ReportView() {
  const [from, setFrom] = useState(() => lastDaysRange().from);
  const [to, setTo] = useState(() => lastDaysRange().to);
  const {
    data: report,
    loading,
    error,
  } = useJsonResource(`/api/time/report?${localDateRangeParams(from, to)}`, {
    errorMessage: "Failed to load report.",
  });

  const exportHref = `/api/time/export?${localDateRangeParams(from, to, { format: "xlsx" })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1">
          <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
            From
          </span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="block rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </label>
        <label className="space-y-1">
          <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
            To
          </span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="block rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </label>
        <a
          href={exportHref}
          className="flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600 hover:bg-zinc-100"
        >
          Export range
        </a>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}

      {!loading && report && (
        <>
          <div className="flex flex-wrap gap-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div>
              <p className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
                Total
              </p>
              <p className="font-mono text-lg font-semibold">
                {formatDuration(report.totalSeconds)}
              </p>
              <p className="text-xs text-zinc-500">
                {formatDurationHours(report.totalSeconds)} h · {report.entryCount}{" "}
                entries
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ReportTable
              title="By project"
              rows={report.byProject.map((r) => ({
                key: r.projectId || "__none__",
                label: r.label,
                totalSeconds: r.totalSeconds,
                entryCount: r.entryCount,
              }))}
            />
            <ReportTable
              title="By client"
              rows={report.byClient.map((r) => ({
                key: r.client,
                label: r.client,
                totalSeconds: r.totalSeconds,
                entryCount: r.entryCount,
              }))}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ReportTable({ title, rows }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-zinc-700">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-400">No data in this range.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs text-zinc-400">
              <th className="py-2 pr-2 font-medium">Name</th>
              <th className="py-2 pr-2 font-medium">Entries</th>
              <th className="py-2 text-right font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-zinc-100">
                <td className="py-2 pr-2 text-zinc-800">{r.label}</td>
                <td className="py-2 pr-2 text-zinc-500">{r.entryCount}</td>
                <td className="py-2 text-right font-mono tabular-nums text-zinc-800">
                  {formatDuration(r.totalSeconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
