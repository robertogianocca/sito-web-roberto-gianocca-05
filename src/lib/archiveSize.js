const UNIT_BYTES = {
  b: 1,
  k: 1024,
  kb: 1024,
  m: 1024 ** 2,
  mb: 1024 ** 2,
  g: 1024 ** 3,
  gb: 1024 ** 3,
  t: 1024 ** 4,
  tb: 1024 ** 4,
};

/**
 * Parse free-text sizes like "3 GB", "1.5TB", "500 MB", "2 T" into bytes.
 * Returns 0 for empty or unparseable values.
 */
export function parseSize(value) {
  if (value == null) return 0;
  const trimmed = String(value).trim();
  if (!trimmed) return 0;

  const match = trimmed.match(/^([\d.,]+)\s*([kmgt]?b?|[kmgt])?$/i);
  if (!match) return 0;

  const amount = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount < 0) return 0;

  const unitKey = (match[2] || "b").toLowerCase();
  const multiplier = UNIT_BYTES[unitKey];
  if (multiplier == null) return 0;

  return amount * multiplier;
}

/**
 * Format a byte count for display (e.g. "1.2 TB").
 */
export function formatBytes(bytes) {
  const n = Number(bytes);
  const safe = Number.isFinite(n) && n > 0 ? n : 0;

  const units = [
    ["TB", 1024 ** 4],
    ["GB", 1024 ** 3],
    ["MB", 1024 ** 2],
    ["KB", 1024],
    ["B", 1],
  ];

  for (const [label, divisor] of units) {
    if (safe >= divisor || label === "B") {
      const value = safe / divisor;
      const rounded =
        label === "B" || value >= 10
          ? Math.round(value)
          : Math.round(value * 10) / 10;
      return `${rounded} ${label}`;
    }
  }

  return "0 B";
}
