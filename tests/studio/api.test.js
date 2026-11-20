import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { setupTempDatabase } from "../helpers/db.js";
import { ensureInit, getTursoClient } from "@/lib/turso";
import { createSessionToken, STUDIO_SESSION_COOKIE } from "@/lib/studio-auth";
import * as projectsRoute from "@/app/api/archive/route";
import * as projectRoute from "@/app/api/archive/[id]/route";
import * as projectTimeRoute from "@/app/api/archive/[id]/time/route";
import * as settingsRoute from "@/app/api/archive/settings/route";
import * as clientsRoute from "@/app/api/archive/clients/route";
import * as timerRoute from "@/app/api/time/timer/route";
import * as entriesRoute from "@/app/api/time/entries/route";
import * as entryRoute from "@/app/api/time/entries/[id]/route";

setupTempDatabase();
process.env.ARCHIVE_SESSION_SECRET = "api-test-secret-0123456789abcdef0123456789";

let cookie;

beforeAll(async () => {
  await ensureInit();
  cookie = `${STUDIO_SESSION_COOKIE}=${await createSessionToken()}`;
});

beforeEach(async () => {
  const db = getTursoClient();
  for (const table of ["projects", "clients", "time_entries", "time_timer"]) {
    await db.execute(`DELETE FROM ${table}`);
  }
  await db.execute(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('projectTypes', '["Video"]'), ('archiveDrives', '["A"]'), ('driveCapacities', '{}')`
  );
});

function request(method, path, body, { signedIn = true } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      ...(signedIn ? { cookie } : {}),
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
    },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

const params = (values) => ({ params: Promise.resolve(values) });

async function call(handler, req, context) {
  const res = await handler(req, context);
  return { status: res.status, body: await res.json() };
}

describe("archive API", () => {
  it("answers 401 without a session", async () => {
    const res = await call(projectsRoute.GET, request("GET", "/api/archive", undefined, { signedIn: false }));
    expect(res.status).toBe(401);
  });

  it("rejects invalid input with 400 and says what is wrong", async () => {
    const res = await call(projectsRoute.POST, request("POST", "/api/archive", { title: 42 }));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/^title:/);
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await call(projectsRoute.POST, request("POST", "/api/archive", "{oops"));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid JSON");
  });

  it("creates a project and adds its new client and type to the lists", async () => {
    const res = await call(
      projectsRoute.POST,
      request("POST", "/api/archive", { title: "Shoot", projectId: "7", client: ["Anna"], type: ["Drone"], id: "ignored" })
    );
    expect(res.status).toBe(201);
    expect(res.body.projectId).toBe("007");
    expect(res.body.id).not.toBe("ignored");

    const clients = await call(clientsRoute.GET, request("GET", "/api/archive/clients"));
    expect(clients.body).toEqual(["Anna"]);
    const settings = await call(settingsRoute.GET, request("GET", "/api/archive/settings"));
    expect(settings.body.projectTypes).toEqual(["Video", "Drone"]);
  });

  it("PATCH changes only the fields sent", async () => {
    const created = await call(
      projectsRoute.POST,
      request("POST", "/api/archive", { title: "Shoot", notes: "keep", paid: false })
    );
    const { id } = created.body;
    const res = await call(projectRoute.PATCH, request("PATCH", `/api/archive/${id}`, { title: "Renamed" }), params({ id }));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: "Renamed", notes: "keep", paid: false });
  });

  it("PATCH answers 404 for an unknown project", async () => {
    const res = await call(projectRoute.PATCH, request("PATCH", "/api/archive/nope", { title: "x" }), params({ id: "nope" }));
    expect(res.status).toBe(404);
  });

  it("settings never include internal rows", async () => {
    const res = await call(settingsRoute.GET, request("GET", "/api/archive/settings"));
    expect(Object.keys(res.body).sort()).toEqual(["archiveDrives", "driveCapacities", "projectTypes"]);
  });

  it("saves settings, renames and clients in one request", async () => {
    await call(projectsRoute.POST, request("POST", "/api/archive", { title: "P", client: ["Anna"], type: ["Video"] }));
    const res = await call(
      settingsRoute.PUT,
      request("PUT", "/api/archive/settings", {
        projectTypes: ["Film"],
        archiveDrives: ["A"],
        renames: { projectTypes: [{ from: "Video", to: "Film" }], clients: [{ from: "Anna", to: "Anna B." }] },
        clients: ["Anna B."],
      })
    );
    expect(res.status).toBe(200);
    expect(res.body.projectTypes).toEqual(["Film"]);
    const projects = await call(projectsRoute.GET, request("GET", "/api/archive"));
    expect(projects.body[0]).toMatchObject({ type: ["Film"], client: ["Anna B."] });
  });
});

describe("project time summary", () => {
  it("reports the time logged on a project", async () => {
    const created = await call(projectsRoute.POST, request("POST", "/api/archive", { title: "P" }));
    const { id } = created.body;
    for (const [start, end] of [["09:00", "10:30"], ["11:00", "11:30"]]) {
      await call(entriesRoute.POST, request("POST", "/api/time/entries", {
        projectId: id,
        startedAt: `2026-11-20T${start}:00Z`,
        endedAt: `2026-11-20T${end}:00Z`,
      }));
    }
    const res = await call(projectTimeRoute.GET, request("GET", `/api/archive/${id}/time`), params({ id }));
    expect(res.body).toEqual({ entryCount: 2, totalSeconds: 2 * 3600 });
  });
});

describe("time API", () => {
  it("answers 409 with a message when stopping without a timer", async () => {
    const res = await call(timerRoute.POST, request("POST", "/api/time/timer", { action: "stop" }));
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("No timer is running.");
  });

  it("rejects an unknown timer action with 400", async () => {
    const res = await call(timerRoute.POST, request("POST", "/api/time/timer", { action: "explode" }));
    expect(res.status).toBe(400);
  });

  it("starts and stops a timer", async () => {
    const start = await call(timerRoute.POST, request("POST", "/api/time/timer", { action: "start", description: "Edit" }));
    expect(start.status).toBe(201);
    const stop = await call(timerRoute.POST, request("POST", "/api/time/timer", { action: "stop" }));
    expect(stop.status).toBe(200);
    expect(stop.body.entry.description).toBe("Edit");
  });

  it("rejects an entry that ends before it starts", async () => {
    const res = await call(
      entriesRoute.POST,
      request("POST", "/api/time/entries", { startedAt: "2026-11-20T10:00:00Z", endedAt: "2026-11-20T09:00:00Z" })
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/End must not be before start/);
  });

  it("rejects an edit that moves the end before the start", async () => {
    const created = await call(
      entriesRoute.POST,
      request("POST", "/api/time/entries", { startedAt: "2026-11-20T10:00:00Z", endedAt: "2026-11-20T11:00:00Z" })
    );
    const { id } = created.body;
    const res = await call(entryRoute.PUT, request("PUT", `/api/time/entries/${id}`, { endedAt: "2026-11-20T09:00:00Z" }), params({ id }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid date in the query with 400", async () => {
    const res = await call(entriesRoute.GET, request("GET", "/api/time/entries?from=yesterday"));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/^from:/);
  });

  it("answers 404 when editing an entry that does not exist", async () => {
    const res = await call(entryRoute.PUT, request("PUT", "/api/time/entries/nope", { description: "x" }), params({ id: "nope" }));
    expect(res.status).toBe(404);
  });
});
