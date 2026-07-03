"use client";

import { ArchiveRow } from "./ArchiveRow";

const thClass =
  "px-3 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap";
const thCenterClass =
  "px-3 py-2.5 text-center text-2xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap";

export function ArchiveTable({ projects, onEdit }) {
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
            <th className={thClass}>ID</th>
            <th className={thClass}>Title</th>
            <th className={thClass}>Client</th>
            <th className={thClass}>Type</th>
            <th className={thClass}>Date</th>
            <th className={thClass}>Archive</th>
            <th className={thClass}>Backup</th>
            <th className={thCenterClass}>Cleaned</th>
            <th className={thCenterClass}>Backed up</th>
            <th className={thCenterClass}>Verified</th>
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
