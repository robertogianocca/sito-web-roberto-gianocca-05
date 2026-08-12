"use client";

import { ArchiveRow } from "./ArchiveRow";

const COLUMNS = [
  { key: "projectId", label: "ID", align: "left" },
  { key: "title", label: "Title", align: "left" },
  { key: "client", label: "Client", align: "left" },
  { key: "type", label: "Type", align: "left" },
  { key: "date", label: "Date", align: "left" },
  { key: "archiveDrive", label: "Archive", align: "left" },
  { key: "backupDrive", label: "Backup", align: "left" },
  { key: "size", label: "Size", align: "left" },
  { key: "cleaned", label: "Cleaned", align: "center" },
  { key: "backupCompleted", label: "Backed up", align: "center" },
];

function SortableTh({ column, sortKey, sortDir, onSort }) {
  const active = sortKey === column.key;
  const alignClass = column.align === "center" ? "text-center" : "text-left";

  return (
    <th className={`px-3 py-2.5 ${alignClass}`}>
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className={`inline-flex max-w-24 items-center gap-1 text-2xs font-semibold uppercase tracking-wider transition ${
          active ? "text-zinc-800" : "text-zinc-500 hover:text-zinc-700"
        }`}
        title={`Sort by ${column.label}`}
      >
        <span className="truncate">{column.label}</span>
        {active && (
          <svg
            className="h-3 w-3 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden
          >
            {sortDir === "asc" ? (
              <path d="m18 15-6-6-6 6" />
            ) : (
              <path d="m6 9 6 6 6-6" />
            )}
          </svg>
        )}
      </button>
    </th>
  );
}

export function ArchiveTable({ projects, onEdit, sortKey, sortDir, onSort }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
        <svg
          className="mb-4 h-10 w-10 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
        <p className="text-sm">No projects found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse">
        <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm">
          <tr>
            {COLUMNS.map((column) => (
              <SortableTh
                key={column.key}
                column={column}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <ArchiveRow key={project.id} project={project} onEdit={onEdit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
