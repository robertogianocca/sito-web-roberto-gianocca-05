"use client";

const selectBaseClass =
  "h-8 rounded-lg border px-2 pr-7 text-sm outline-none ring-zinc-400 focus:ring-2 appearance-none cursor-pointer transition";

function sortAlpha(list) {
  return [...(list ?? [])].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
  );
}

function Select({ value, onChange, active, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${selectBaseClass} ${
          active
            ? "border-transparent bg-zinc-600 text-zinc-50"
            : "border-zinc-300 bg-background text-foreground"
        }`}
      >
        {children}
      </select>
      <svg
        className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 ${
          active ? "text-zinc-300" : "text-zinc-400"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function FilterBar({
  filterType,
  filterYear,
  filterStatus,
  filterArchiveDrive,
  search = "",
  projectTypes,
  archiveDrives,
  availableYears,
  onFilterType,
  onFilterYear,
  onFilterStatus,
  onFilterArchiveDrive,
  onClear,
}) {
  const hasActiveFilters =
    Boolean(search?.trim()) ||
    filterType !== "all" ||
    filterYear !== "all" ||
    filterStatus !== "all" ||
    filterArchiveDrive !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filterType}
        onChange={onFilterType}
        active={filterType !== "all"}
      >
        <option value="all">All types</option>
        {sortAlpha(projectTypes).map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>

      <Select
        value={filterYear}
        onChange={onFilterYear}
        active={filterYear !== "all"}
      >
        <option value="all">All years</option>
        {availableYears.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>

      <Select
        value={filterStatus}
        onChange={onFilterStatus}
        active={filterStatus !== "all"}
      >
        <option value="all">All statuses</option>
        <option value="complete">Complete</option>
        <option value="partial">In progress</option>
        <option value="open">Incomplete</option>
        <option value="unarchived">Not archived</option>
      </Select>

      <Select
        value={filterArchiveDrive}
        onChange={onFilterArchiveDrive}
        active={filterArchiveDrive !== "all"}
      >
        <option value="all">All archive drives</option>
        {sortAlpha(archiveDrives).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </Select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-300 bg-background px-2.5 text-sm text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
          aria-label="Clear filters"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}
