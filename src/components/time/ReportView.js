"use client";

import { useCallback, useEffect, useState } from "react";
import {
  formatDuration,
  formatDurationHours,
  toLocalDateInput,
} from "@/lib/timeFormat";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: toLocalDateInput(from),
    to: toLocalDateInput(to),
  };
}

export function ReportView() {
  const defaults = defaultRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fromIso = from ? new Date(`${from}T00:00:00`).toISOString() : "";
      const toEnd = to ? new Date(`${to}T00:00:00`) : null;
      if (toEnd) toEnd.setDate(toEnd.getDate() + 1);
      const toIso = toEnd ? toEnd.toISOString() : "";
      const qs = new URLSearchParams();
      if (fromIso) qs.set("from", fromIso);
      if (toIso) qs.set("to", toIso);
      const res = await fetch(`/api/time/report?${qs}`);
      if (!res.ok) throw new Error("Failed to load report.");
      setReport(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const exportHref = (() => {
    const fromIso = from ? new Date(`${from}T00:00:00`).toISOString() : "";
    const toEnd = to ? new Date(`${to}T00:00:00`) : null;
    if (toEnd) toEnd.setDate(toEnd.getDate() + 1);
    const toIso = toEnd ? toEnd.toISOString() : "";
    const qs = new URLSearchParams({ format: "xlsx" });
    if (fromIso) qs.set("from", fromIso);
    if (toIso) qs.set("to", toIso);
    return `/api/time/export?${qs}`;
  })();

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

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

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
