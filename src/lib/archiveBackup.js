const VALID_BACKUP_TYPES = new Set(["", "full", "export"]);

export function normalizeBackupType(value, legacyBackupCompleted = false) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (VALID_BACKUP_TYPES.has(normalized) && normalized) return normalized;
  if (legacyBackupCompleted) return "full";
  return "";
}

export function isBackupDone(backupType) {
  return backupType === "full" || backupType === "export";
}

export function backupTypeLabel(backupType) {
  if (backupType === "full") return "Full";
  if (backupType === "export") return "Export";
  return "";
}
