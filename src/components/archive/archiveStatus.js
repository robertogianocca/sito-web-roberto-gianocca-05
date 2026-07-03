/**
 * Derives the 4-level status of a project from its fields.
 *
 * complete    — cleaned + backupCompleted + verified all true
 * partial     — at least one of the three is true
 * open        — archiveDrive set but nothing done yet
 * unarchived  — no archiveDrive set
 */
export function getStatus(project) {
  if (!project.archiveDrive) return "unarchived";
  if (project.cleaned && project.backupCompleted && project.verified)
    return "complete";
  if (project.cleaned || project.backupCompleted || project.verified)
    return "partial";
  return "open";
}

export const STATUS_META = {
  complete: {
    label: "Complete",
    rowClass: "border-l-emerald-400 bg-emerald-50/60",
    dotClass: "bg-emerald-400",
  },
  partial: {
    label: "In progress",
    rowClass: "border-l-amber-400 bg-amber-50/50",
    dotClass: "bg-amber-400",
  },
  open: {
    label: "Incomplete",
    rowClass: "border-l-rose-400 bg-rose-50/50",
    dotClass: "bg-rose-400",
  },
  unarchived: {
    label: "Not archived",
    rowClass: "border-l-zinc-300",
    dotClass: "bg-zinc-300",
  },
};
