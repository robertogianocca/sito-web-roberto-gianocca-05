"use client";

const inputClass =
  "block rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400";
const labelClass = "text-2xs font-mono uppercase tracking-wider text-zinc-400";

/** "From" and "To" date fields (YYYY-MM-DD values). */
export function DateRangeFields({ from, to, onFromChange, onToChange }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="space-y-1">
        <span className={labelClass}>From</span>
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className={inputClass} />
      </label>
      <label className="space-y-1">
        <span className={labelClass}>To</span>
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className={inputClass} />
      </label>
    </div>
  );
}
