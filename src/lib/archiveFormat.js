export function formatProjectId(id) {
  const trimmed = String(id ?? "").trim();
  if (/^\d+$/.test(trimmed)) return trimmed.padStart(3, "0");
  return trimmed;
}
