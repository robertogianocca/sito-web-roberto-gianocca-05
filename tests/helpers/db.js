import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Points the Turso client at a fresh SQLite file for this test file.
 * Call at the top of the test file: the client reads the URL on first use,
 * and Vitest gives every test file its own module instances.
 */
export function setupTempDatabase() {
  const dir = mkdtempSync(path.join(tmpdir(), "studio-test-"));
  process.env.TURSO_DATABASE_URL = `file:${path.join(dir, "test.db")}`;
}
