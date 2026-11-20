import { z } from "zod";
import { InputError } from "./errors";

/**
 * Input schemas for the studio API. Unknown keys are dropped, so clients can
 * send whole objects (with id, createdAt, …) without errors. Limits are
 * generous; they exist to reject garbage, not normal use.
 */

const text = (max) => z.string().max(max);
const nameList = z.array(z.string().min(1).max(200)).max(200);
const isoDateTime = z.iso.datetime({ offset: true });
const MAX_ENTRY_SECONDS = 7 * 24 * 60 * 60;

// ── Archive ──────────────────────────────────────────────────────────────

/** Project fields; every field optional (create fills defaults, patch merges). */
export const projectSchema = z.object({
  projectId: text(50),
  invoiceNumber: text(100),
  title: text(500),
  client: nameList,
  type: nameList,
  date: text(100),
  location: text(500),
  archiveDrive: nameList,
  backupDrive: nameList,
  size: text(50),
  cleaned: z.boolean(),
  backupType: z.enum(["", "full", "export"]),
  contact: text(1000),
  paid: z.boolean(),
  notes: text(20000),
  tags: z.array(z.string().max(100)).max(100),
}).partial();

export const clientNameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
});

export const clientRenameSchema = z.object({
  from: z.string().trim().min(1, "from is required").max(200),
  to: z.string().trim().min(1, "to is required").max(200),
});

const renameList = z
  .array(z.object({ from: z.string().trim().min(1).max(200), to: z.string().trim().min(1).max(200) }))
  .max(500);

export const settingsSaveSchema = z.object({
  projectTypes: nameList,
  archiveDrives: nameList,
  driveCapacities: z.record(z.string(), z.string().max(50)).optional(),
  renames: z
    .object({
      projectTypes: renameList.optional(),
      archiveDrives: renameList.optional(),
      clients: renameList.optional(),
    })
    .optional(),
  /** Values removed from a list that are also removed from every project. */
  removals: z
    .object({
      projectTypes: nameList.optional(),
      archiveDrives: nameList.optional(),
      clients: nameList.optional(),
    })
    .optional(),
  /** Final client list. When present, the client list is saved too. */
  clients: nameList.optional(),
});

// ── Time ─────────────────────────────────────────────────────────────────

const entryFields = {
  projectId: text(100).optional(),
  description: text(1000).optional(),
  startedAt: isoDateTime.optional(),
  endedAt: isoDateTime.optional(),
  durationSeconds: z.number().int().min(0).max(MAX_ENTRY_SECONDS).optional(),
};

function endNotBeforeStart(entry) {
  if (!entry.startedAt || !entry.endedAt) return true;
  return Date.parse(entry.endedAt) >= Date.parse(entry.startedAt);
}

const endAfterStart = {
  message: "End must not be before start.",
  path: ["endedAt"],
};

export const timeEntryCreateSchema = z
  .object(entryFields)
  .refine(endNotBeforeStart, endAfterStart);

export const timeEntryUpdateSchema = z
  .object(entryFields)
  .refine(endNotBeforeStart, endAfterStart);

export const renameDescriptionSchema = z.object({
  projectId: text(100).default(""),
  from: text(1000).default(""),
  to: z.string().trim().min(1, "The new description cannot be empty.").max(1000),
});

const timerFields = {
  projectId: text(100).optional(),
  description: text(1000).optional(),
  pomodoroEnabled: z.boolean().optional(),
  pomodoroMinutes: z.number().int().min(1).max(240).optional(),
};

export const timerActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), ...timerFields }),
  z.object({ action: z.literal("pause") }),
  z.object({ action: z.literal("resume") }),
  z.object({
    action: z.literal("stop"),
    description: text(1000).optional(),
    source: z.enum(["timer", "pomodoro", "manual"]).optional(),
  }),
  z.object({ action: z.literal("update"), ...timerFields }),
  z.object({ action: z.literal("checkPomodoro"), description: text(1000).optional() }),
]);

/** Query `from` / `to` as ISO timestamps (both optional). */
export const rangeQuerySchema = z.object({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
});

export const entriesQuerySchema = rangeQuerySchema.extend({
  view: z.enum(["today", "week"]).optional(),
  week: isoDateTime.optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────────

/** Validates `value`; throws InputError (→ 400) naming the first problem. */
export function parseInput(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issues = result.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  const first = issues[0];
  throw new InputError(first.path ? `${first.path}: ${first.message}` : first.message, issues);
}

/** Reads and validates a JSON request body. */
export async function parseJsonBody(request, schema) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new InputError("Invalid JSON");
  }
  return parseInput(schema, body);
}

/** Validates the query string; empty values count as missing. */
export function parseSearchParams(request, schema) {
  const params = {};
  for (const [key, value] of new URL(request.url).searchParams) {
    if (value !== "") params[key] = value;
  }
  return parseInput(schema, params);
}
