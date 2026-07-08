"use client";

import { getStatus, STATUS_META } from "./archiveStatus";

function Check({ value }) {
  if (value) {
    return (
      <svg
        className="mx-auto h-3.5 w-3.5 text-emerald-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-label="Yes"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  return (
    <svg
      className="mx-auto h-3.5 w-3.5 text-zinc-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label="No"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const cellClass = "px-3 py-2 text-sm text-foreground";
const mutedCellClass = "px-3 py-2 text-sm text-zinc-500";

export function ArchiveRow({ project, onEdit }) {
  const status = getStatus(project);
  const { rowClass } = STATUS_META[status];

  return (
    <tr
      onClick={() => onEdit(project)}
      className={`border-b border-zinc-200 border-l-4 cursor-pointer transition-colors hover:brightness-95 ${rowClass}`}
    >
      <td className={mutedCellClass}>{project.projectId || "—"}</td>
      <td className={cellClass}>
        <span className="font-medium">{project.title || "Untitled"}</span>
        {project.tags?.length > 0 && (
          <span className="ml-2 text-2xs text-zinc-400">
            {project.tags.slice(0, 3).join(", ")}
          </span>
        )}
      </td>
      <td className={mutedCellClass}>{Array.isArray(project.client) ? (project.client.join(", ") || "—") : (project.client || "—")}</td>
      <td className={mutedCellClass}>{Array.isArray(project.type) ? (project.type.join(", ") || "—") : (project.type || "—")}</td>
      <td className={mutedCellClass}>{project.date || "—"}</td>
      <td className={mutedCellClass}>{Array.isArray(project.archiveDrive) ? (project.archiveDrive.join(", ") || "—") : (project.archiveDrive || "—")}</td>
      <td className={mutedCellClass}>{Array.isArray(project.backupDrive) ? (project.backupDrive.join(", ") || "—") : (project.backupDrive || "—")}</td>
      <td className={mutedCellClass}>{project.size || "—"}</td>
      <td className="px-3 py-2 text-center">
        <Check value={project.cleaned} />
      </td>
      <td className="px-3 py-2 text-center">
        <Check value={project.backupCompleted} />
      </td>
    </tr>
  );
}
