"use client";

const selectClass =
  "h-8 rounded-lg border border-zinc-300 bg-background px-2 pr-7 text-sm text-foreground outline-none ring-zinc-400 focus:ring-2 appearance-none cursor-pointer";

function Select({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400"
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
  sortKey,
  sortDir,
  projectTypes,
  availableYears,
  onFilterType,
  onFilterYear,
  onFilterStatus,
  onSortKey,
  onSortDir,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={filterType} onChange={onFilterType}>
        <option value="all">All types</option>
        {projectTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>

      <Select value={filterYear} onChange={onFilterYear}>
        <option value="all">All years</option>
        {availableYears.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>

      <Select value={filterStatus} onChange={onFilterStatus}>
        <option value="all">All statuses</option>
        <option value="complete">Complete</option>
        <option value="partial">In progress</option>
        <option value="open">Incomplete</option>
        <option value="unarchived">Not archived</option>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        <Select value={sortKey} onChange={onSortKey}>
          <option value="date">Sort by date</option>
          <option value="title">Sort by title</option>
          <option value="client">Sort by client</option>
          <option value="projectId">Sort by project ID</option>
        </Select>

        <button
          onClick={() => onSortDir(sortDir === "asc" ? "desc" : "asc")}
          title={sortDir === "asc" ? "Ascending" : "Descending"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 bg-background text-zinc-500 transition hover:bg-zinc-100 hover:text-foreground"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            {sortDir === "asc" ? (
              <path d="M3 8h18M3 12h12M3 16h6" />
            ) : (
              <path d="M3 16h18M3 12h12M3 8h6" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
