import { describe, expect, it } from "vitest";
import { countUsage, originalName, unlistedNames } from "@/components/archive/settings/usage";

const projects = [
  { type: ["Video"], archiveDrive: ["A"], backupDrive: ["A"], client: ["Anna"] },
  { type: ["Video", "Drone"], archiveDrive: ["B"], backupDrive: [], client: ["Anna", "Old client"] },
];

describe("settings usage", () => {
  it("counts projects per name, a drive once per project", () => {
    const usage = countUsage(projects);
    expect(Object.fromEntries(usage.projectTypes)).toEqual({ Video: 2, Drone: 1 });
    expect(Object.fromEntries(usage.archiveDrives)).toEqual({ A: 1, B: 1 });
    expect(Object.fromEntries(usage.clients)).toEqual({ Anna: 2, "Old client": 1 });
  });

  it("follows renames back to the saved name", () => {
    const renames = [{ from: "Video", to: "Film" }, { from: "Film", to: "Movie" }];
    expect(originalName("Movie", renames)).toBe("Video");
    expect(originalName("Drone", renames)).toBe("Drone");
  });

  it("lists names used by projects but missing from the list", () => {
    const usage = countUsage(projects);
    expect(unlistedNames(usage.clients, ["Anna"])).toEqual(["Old client"]);
    // renamed in this session: not missing
    expect(unlistedNames(usage.projectTypes, ["Film", "Drone"], [{ from: "Video", to: "Film" }])).toEqual([]);
    // being removed from the projects too: not offered back
    expect(unlistedNames(usage.clients, ["Anna"], [], ["Old client"])).toEqual([]);
  });
});
