import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  availableYears,
  defaultSortDir,
  driveUsageSummary,
  filterProjects,
  hasActiveFilters,
  sortProjects,
} from "@/components/archive/archiveFilters";

const project = (fields) => ({
  projectId: "",
  title: "",
  client: [],
  type: [],
  date: "",
  archiveDrive: [],
  backupDrive: [],
  size: "",
  cleaned: false,
  backupType: "",
  invoiceNumber: "",
  tags: [],
  ...fields,
});

const projects = [
  project({ projectId: "002", title: "Wedding Rossi", client: ["Anna"], type: ["Photography"], date: "May 2025", archiveDrive: ["A"], size: "500 GB", cleaned: true, backupType: "full" }),
  project({ projectId: "10", title: "Catalogue", client: ["Shop"], type: ["Video"], date: "2026", archiveDrive: ["A", "B"], size: "1 TB", tags: ["print"] }),
  project({ projectId: "001", title: "Drone test", type: ["Drone", "Video"], date: "Maggio 2026", archiveDrive: ["A"], size: "200 GB", invoiceNumber: "INV-7" }),
  project({ projectId: "003", title: "Not archived" }),
];

const titles = (list) => list.map((p) => p.title);
const filter = (fields) => filterProjects(projects, { ...EMPTY_FILTERS, ...fields });

describe("filterProjects", () => {
  it("returns everything with no filters", () => {
    expect(filter({})).toHaveLength(4);
  });

  it("searches title, client, id, padded id, invoice and tags, ignoring case", () => {
    expect(titles(filter({ search: "rossi" }))).toEqual(["Wedding Rossi"]);
    expect(titles(filter({ search: "shop" }))).toEqual(["Catalogue"]);
    expect(titles(filter({ search: "010" }))).toEqual(["Catalogue"]); // "10" shown as "010"
    expect(titles(filter({ search: "inv-7" }))).toEqual(["Drone test"]);
    expect(titles(filter({ search: "PRINT" }))).toEqual(["Catalogue"]);
  });

  it("combines type, year, status and drive filters", () => {
    expect(titles(filter({ type: "Video" }))).toEqual(["Catalogue", "Drone test"]);
    expect(titles(filter({ type: "Video", year: "2026" }))).toEqual(["Catalogue", "Drone test"]);
    expect(titles(filter({ status: "complete" }))).toEqual(["Wedding Rossi"]);
    expect(titles(filter({ status: "unarchived" }))).toEqual(["Not archived"]);
    expect(titles(filter({ archiveDrive: "B" }))).toEqual(["Catalogue"]);
  });

  it("knows when any filter is active", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, search: "x" })).toBe(true);
  });
});

describe("sortProjects", () => {
  it("sorts ids naturally and does not change the input", () => {
    const sorted = sortProjects(projects, "projectId", "asc");
    expect(sorted.map((p) => p.projectId)).toEqual(["001", "002", "003", "10"]);
    expect(projects[0].projectId).toBe("002");
  });

  it("sorts lists by their joined text and booleans/backup by rank", () => {
    expect(titles(sortProjects(projects, "client", "asc"))[2]).toBe("Wedding Rossi");
    expect(titles(sortProjects(projects, "cleaned", "desc"))[0]).toBe("Wedding Rossi");
    expect(titles(sortProjects(projects, "backupType", "desc"))[0]).toBe("Wedding Rossi");
  });

  it("starts date columns newest first", () => {
    expect(defaultSortDir("date")).toBe("desc");
    expect(defaultSortDir("title")).toBe("asc");
  });
});

describe("availableYears", () => {
  it("lists years found in free-text dates, newest first", () => {
    expect(availableYears(projects)).toEqual(["2026", "2025"]);
  });
});

describe("driveUsageSummary", () => {
  it("counts only projects stored on that drive alone", () => {
    // "Catalogue" (1 TB) is on A and B, so it does not count for A
    expect(driveUsageSummary(projects, "A", { A: "1 TB" })).toBe(
      "A · 700 GB used · 324 GB free of 1 TB"
    );
  });

  it("reports when a drive is over capacity or has none set", () => {
    expect(driveUsageSummary(projects, "A", { A: "600 GB" })).toBe("A · 700 GB used · 100 GB over 600 GB");
    expect(driveUsageSummary(projects, "B")).toBe("B · 0 B used · capacity not set");
  });

  it("is empty when no drive is selected", () => {
    expect(driveUsageSummary(projects, "all")).toBeNull();
  });
});
