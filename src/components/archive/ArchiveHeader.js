"use client";

import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { COLUMNS } from "./ArchiveTable";
import { FilterBar } from "./FilterBar";
import { ExportButton } from "./ExportButton";
import { StatusLegend } from "./StatusLegend";

/** Title, counts, actions, search and filters above the archive table. */
export function ArchiveHeader({
  loading,
  shownCount,
  totalCount,
  filters,
  setFilter,
  onClearFilters,
  projectTypes,
  archiveDrives,
  availableYears,
  driveUsage,
  onOpenSettings,
  onNew,
  sortKey,
  sortDir,
  onSortKey,
  onToggleSortDir,
}) {
  // Small screens: filters fold away behind a button; the table headers are
  // hidden there, so sorting gets its own control.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = ["type", "year", "status", "archiveDrive"].filter(
    (key) => filters[key] !== "all"
  ).length;

  return (
    <header className="border-b border-zinc-200 bg-background px-4 py-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">Archive</h1>
          {!loading && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
              {shownCount}
              {shownCount !== totalCount
                ? ` / ${totalCount}`
                : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExportButton />
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            title="Settings"
            aria-label="Open settings"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNew}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-zinc-50 transition hover:bg-zinc-700"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={filters.search} onChange={setFilter("search")} />
        <div className="flex w-full items-center gap-2 md:hidden">
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="archive-filters"
            onClick={() => setFiltersOpen((open) => !open)}
            className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition ${
              activeFilters > 0
                ? "border-transparent bg-zinc-600 text-zinc-50"
                : filtersOpen
                  ? "border-zinc-400 bg-zinc-100 text-zinc-800"
                  : "border-zinc-300 bg-background text-zinc-600"
            }`}
          >
            Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}
          </button>
          <label className="sr-only" htmlFor="archive-sort">
            Sort by
          </label>
          <select
            id="archive-sort"
            value={sortKey}
            onChange={(e) => onSortKey(e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-background px-2 text-sm text-foreground"
          >
            {COLUMNS.map((column) => (
              <option key={column.key} value={column.key}>
                Sort: {column.key === "backupType" ? "Backup type" : column.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onToggleSortDir}
            aria-label={sortDir === "asc" ? "Ascending, switch to descending" : "Descending, switch to ascending"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-background text-zinc-600"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
        <div id="archive-filters" className={`w-full md:block md:w-auto md:flex-1 ${filtersOpen ? "block" : "hidden"}`}>
          <FilterBar
            filterType={filters.type}
            filterYear={filters.year}
            filterStatus={filters.status}
            filterArchiveDrive={filters.archiveDrive}
            search={filters.search}
            projectTypes={projectTypes}
            archiveDrives={archiveDrives}
            availableYears={availableYears}
            onFilterType={setFilter("type")}
            onFilterYear={setFilter("year")}
            onFilterStatus={setFilter("status")}
            onFilterArchiveDrive={setFilter("archiveDrive")}
            onClear={onClearFilters}
          />
        </div>
      </div>

      {driveUsage && (
        <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800">
          {driveUsage}
        </p>
      )}

      <div className="mt-3">
        <StatusLegend />
      </div>
    </header>
  );
}
