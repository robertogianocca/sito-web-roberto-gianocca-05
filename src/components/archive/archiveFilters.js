import { getStatus, formatProjectId } from "./archiveStatus";
import { parseSize, formatBytes } from "@/lib/archiveSize";

/**
 * Pure helpers behind the archive table: search and filters, sorting, years
 * for the year filter, and the used/free summary of a drive.
 * Projects come from the API, so list fields (client, type, drives, tags)
 * are always arrays.
 */

export const ALL = "all";

export const EMPTY_FILTERS = {
  search: "",
  type: ALL,
  year: ALL,
  status: ALL,
  archiveDrive: ALL,
};

export function hasActiveFilters(filters) {
  return Object.entries(EMPTY_FILTERS).some(([key, value]) => filters[key] !== value);
}

/** Four-digit years found in the projects' free-text dates, newest first. */
export function availableYears(projects) {
  const years = new Set(projects.map((p) => p.date?.match(/\d{4}/)?.[0]).filter(Boolean));
  return [...years].sort((a, b) => b.localeCompare(a));
}

function matchesSearch(project, q) {
  const has = (text) => String(text ?? "").toLowerCase().includes(q);
  return (
    has(project.title) ||
    (project.client ?? []).some(has) ||
    has(project.projectId) ||
    has(formatProjectId(project.projectId)) ||
    has(project.invoiceNumber) ||
    (project.tags ?? []).some(has)
  );
}

export function filterProjects(projects, filters) {
  const q = filters.search.trim().toLowerCase();
  return projects.filter(
    (p) =>
      (!q || matchesSearch(p, q)) &&
      (filters.type === ALL || (p.type ?? []).includes(filters.type)) &&
      (filters.year === ALL || Boolean(p.date?.includes(filters.year))) &&
      (filters.status === ALL || getStatus(p) === filters.status) &&
      (filters.archiveDrive === ALL || (p.archiveDrive ?? []).includes(filters.archiveDrive))
  );
}

const BACKUP_ORDER = { "": 0, export: 1, full: 2 };

function sortValue(project, key) {
  const value = project[key];
  if (Array.isArray(value)) return value.join(", ");
  if (key === "projectId") return formatProjectId(value);
  return String(value ?? "");
}

/** A sorted copy. Text compares naturally ("2" before "10"), ignoring case. */
export function sortProjects(projects, key, dir) {
  const sign = dir === "asc" ? 1 : -1;
  return [...projects].sort((a, b) => {
    if (key === "cleaned") return (Number(Boolean(a.cleaned)) - Number(Boolean(b.cleaned))) * sign;
    if (key === "backupType") {
      return ((BACKUP_ORDER[a.backupType] ?? 0) - (BACKUP_ORDER[b.backupType] ?? 0)) * sign;
    }
    return (
      sortValue(a, key).localeCompare(sortValue(b, key), undefined, {
        numeric: true,
        sensitivity: "base",
      }) * sign
    );
  });
}

/** Direction used the first time a column is sorted (dates: newest first). */
export function defaultSortDir(key) {
  return key === "date" ? "desc" : "asc";
}

/**
 * "Drive · 1.2 TB used · 800 GB free of 2 TB" for the projects shown.
 * Only projects stored on that drive alone count, since a project split over
 * several drives has no per-drive size. Null when no drive is selected.
 */
export function driveUsageSummary(projects, drive, capacities = {}) {
  if (!drive || drive === ALL) return null;

  let usedBytes = 0;
  for (const project of projects) {
    const drives = project.archiveDrive ?? [];
    if (drives.length === 1 && drives[0] === drive) usedBytes += parseSize(project.size);
  }

  const used = formatBytes(usedBytes);
  const capacityBytes = parseSize(capacities[drive] ?? "");
  if (capacityBytes <= 0) return `${drive} · ${used} used · capacity not set`;

  const freeBytes = capacityBytes - usedBytes;
  const capacity = formatBytes(capacityBytes);
  return freeBytes >= 0
    ? `${drive} · ${used} used · ${formatBytes(freeBytes)} free of ${capacity}`
    : `${drive} · ${used} used · ${formatBytes(-freeBytes)} over ${capacity}`;
}
