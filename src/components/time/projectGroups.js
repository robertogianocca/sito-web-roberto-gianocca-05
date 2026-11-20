import { projectLabel } from "./projectLabel";

/**
 * Entries grouped by description: the same text with different case or
 * spacing is one group (the rule renameDescription uses). Largest first.
 */
export function groupByDescription(entries) {
  const map = new Map();
  for (const entry of entries) {
    const text = (entry.description ?? "").trim();
    const key = text.toLowerCase();
    const group = map.get(key) ?? {
      key,
      label: text || "No description",
      totalSeconds: 0,
      entries: [],
    };
    group.totalSeconds += entry.durationSeconds || 0;
    group.entries.push(entry);
    map.set(key, group);
  }
  return [...map.values()].sort((a, b) => b.totalSeconds - a.totalSeconds);
}

/**
 * Entries grouped by project, each with its description groups. Largest
 * first. `projectMap` maps project id → project (for the label).
 */
export function groupByProject(entries, projectMap) {
  const map = new Map();
  for (const entry of entries) {
    const key = entry.projectId || "__none__";
    const group = map.get(key) ?? {
      key,
      projectId: entry.projectId || "",
      totalSeconds: 0,
      entries: [],
    };
    group.totalSeconds += entry.durationSeconds || 0;
    group.entries.push(entry);
    map.set(key, group);
  }
  return [...map.values()]
    .map((group) => ({
      ...group,
      label: group.projectId ? projectLabel(projectMap.get(group.projectId)) : "No project",
      descriptions: groupByDescription(group.entries),
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
}
