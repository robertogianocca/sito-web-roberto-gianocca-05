/**
 * How many projects use each type, drive and client, for the settings
 * drawer. Counted from the projects already loaded, so no extra request.
 */

function increment(map, name) {
  map.set(name, (map.get(name) ?? 0) + 1);
}

/** `{ projectTypes, archiveDrives, clients }`, each a Map name → project count. */
export function countUsage(projects) {
  const usage = { projectTypes: new Map(), archiveDrives: new Map(), clients: new Map() };
  for (const project of projects) {
    for (const name of new Set(project.type ?? [])) increment(usage.projectTypes, name);
    // A drive counts once per project, whether it holds the archive or the backup.
    const drives = new Set([...(project.archiveDrive ?? []), ...(project.backupDrive ?? [])]);
    for (const name of drives) increment(usage.archiveDrives, name);
    for (const name of new Set(project.client ?? [])) increment(usage.clients, name);
  }
  return usage;
}

/** The saved name of a list item, following this session's renames back. */
export function originalName(name, renames = []) {
  let current = name;
  for (const { from, to } of [...renames].reverse()) {
    if (to === current) current = from;
  }
  return current;
}

/**
 * Names that projects use but the list does not have (after this session's
 * renames, and leaving out those being removed from the projects too).
 */
export function unlistedNames(usageMap, items, renames = [], removedEverywhere = []) {
  const listed = new Set(items.map((item) => originalName(item, renames)));
  const removed = new Set(removedEverywhere);
  return [...usageMap.keys()]
    .filter((name) => !listed.has(name) && !removed.has(name))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}
