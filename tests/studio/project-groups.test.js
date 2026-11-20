import { describe, expect, it } from "vitest";
import { groupByDescription, groupByProject } from "@/components/time/projectGroups";
import { projectLabel } from "@/components/time/projectLabel";

const entry = (projectId, description, minutes) => ({
  id: `${projectId}-${description}-${minutes}`,
  projectId,
  description,
  durationSeconds: minutes * 60,
});

describe("groupByDescription", () => {
  it("merges the same text regardless of case and spaces, largest first", () => {
    const groups = groupByDescription([
      entry("p1", "Editing", 30),
      entry("p1", " editing ", 45),
      entry("p1", "Color", 90),
      entry("p1", "", 10),
    ]);
    expect(groups.map((g) => [g.label, g.totalSeconds / 60, g.entries.length])).toEqual([
      ["Color", 90, 1],
      ["Editing", 75, 2],
      ["No description", 10, 1],
    ]);
  });
});

describe("groupByProject", () => {
  it("groups by project with labels and descriptions, largest first", () => {
    const projectMap = new Map([["p1", { projectId: "001", title: "Wedding" }]]);
    const groups = groupByProject(
      [entry("p1", "Edit", 30), entry("", "Admin", 60), entry("p1", "Edit", 45), entry("gone", "X", 5)],
      projectMap
    );
    expect(groups.map((g) => [g.key, g.label, g.totalSeconds / 60])).toEqual([
      ["p1", "001 — Wedding", 75],
      ["__none__", "No project", 60],
      ["gone", "No project", 5], // a deleted project
    ]);
    expect(groups[0].descriptions).toHaveLength(1);
  });
});

describe("projectLabel", () => {
  it("shows the id when there is one", () => {
    expect(projectLabel({ projectId: "007", title: "Shoot" })).toBe("007 — Shoot");
    expect(projectLabel({ title: "" })).toBe("Untitled");
    expect(projectLabel(null)).toBe("No project");
  });
});
