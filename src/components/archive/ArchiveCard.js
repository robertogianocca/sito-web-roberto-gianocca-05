"use client";

import { getStatus, STATUS_META, formatProjectId } from "./archiveStatus";
import { backupTypeLabel } from "@/lib/archiveBackup";
import { ProjectBadges, listText } from "./ProjectBadges";

/**
 * A project as a card, for small screens: the same information as a table
 * row, stacked. The whole card opens the project.
 */
export function ArchiveCard({ project, onEdit }) {
  const status = getStatus(project);
  const { rowClass, label } = STATUS_META[status];
  const id = formatProjectId(project.projectId);
  const backup = backupTypeLabel(project.backupType);

  return (
    <li className={`border-b border-l-4 border-zinc-200 ${rowClass}`}>
      <button
        type="button"
        onClick={() => onEdit(project)}
        className="block w-full px-4 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-500"
      >
        <span className="flex items-baseline gap-2">
          {id && <span className="shrink-0 font-mono text-xs text-zinc-400">{id}</span>}
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {project.title || "Untitled"}
            <ProjectBadges project={project} />
          </span>
          {project.date && <span className="shrink-0 text-xs text-zinc-500">{project.date}</span>}
        </span>
        {(project.client?.length > 0 || project.type?.length > 0) && (
          <span className="mt-0.5 block truncate text-xs text-zinc-500">
            {listText(project.client)} · {listText(project.type)}
          </span>
        )}
        <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-2xs text-zinc-500">
          <span>Archive {listText(project.archiveDrive)}</span>
          <span>Backup {listText(project.backupDrive)}</span>
          {project.size && <span>{project.size}</span>}
          <span>{project.cleaned ? "Cleaned" : "Not cleaned"}</span>
          <span>{backup ? `${backup} backup` : "No backup"}</span>
          <span className="sr-only">Status: {label}</span>
        </span>
      </button>
    </li>
  );
}
