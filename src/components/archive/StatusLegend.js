import { STATUS_META } from "./archiveStatus";

export function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {Object.entries(STATUS_META).map(([key, { label, dotClass }]) => (
        <span key={key} className="flex items-center gap-1.5 text-2xs text-zinc-500">
          <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />
          {label}
        </span>
      ))}
    </div>
  );
}
