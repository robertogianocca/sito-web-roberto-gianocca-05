import { describe, expect, it } from "vitest";
import {
  addName,
  findSameName,
  dropCapacity,
  moveCapacity,
  removeName,
  renameName,
  sortAlpha,
} from "@/components/archive/settings/listEditing";

describe("settings list editing", () => {
  it("adds a trimmed new name, ignoring empty and duplicate ones", () => {
    expect(addName(["A"], "  B ")).toEqual(["A", "B"]);
    const items = ["A"];
    expect(addName(items, "A")).toBe(items);
    expect(addName(items, "   ")).toBe(items);
  });

  it("renames in place and reports the new name", () => {
    expect(renameName(["A", "B", "C"], "B", " Bee ")).toEqual({ items: ["A", "Bee", "C"], to: "Bee" });
  });

  it("does not rename to an empty, identical or existing name", () => {
    for (const raw of ["", "B", "A"]) {
      expect(renameName(["A", "B"], "B", raw).to).toBeNull();
    }
  });

  it("removes a name", () => {
    expect(removeName(["A", "B"], "A")).toEqual(["B"]);
  });

  it("moves and drops drive capacities with their drive", () => {
    expect(moveCapacity({ A: "4 TB", B: "1 TB" }, "A", "Main")).toEqual({ Main: "4 TB", B: "1 TB" });
    const caps = { B: "1 TB" };
    expect(moveCapacity(caps, "A", "Main")).toBe(caps);
    expect(dropCapacity({ A: "4 TB", B: "1 TB" }, "A")).toEqual({ B: "1 TB" });
  });

  it("sorts names alphabetically, ignoring case", () => {
    expect(sortAlpha(["b", "A", "c"])).toEqual(["A", "b", "c"]);
  });

  it("treats names that differ only in case as the same", () => {
    const items = ["Anna"];
    expect(findSameName(items, "anna")).toBe("Anna");
    expect(addName(items, "ANNA")).toBe(items);
    expect(renameName(["Anna", "Bea"], "Bea", "anna").to).toBeNull();
  });

  it("allows fixing the case of the same name", () => {
    expect(renameName(["anna"], "anna", "Anna")).toEqual({ items: ["Anna"], to: "Anna" });
  });
});
