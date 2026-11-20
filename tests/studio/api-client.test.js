import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "@/components/studio/api";

function respond(status, body) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body === undefined ? "" : JSON.stringify(body), { status }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("sends JSON and returns the parsed response", async () => {
    respond(200, { ok: true });
    await expect(apiFetch("/api/x", { method: "POST", body: { a: 1 } })).resolves.toEqual({ ok: true });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("/api/x");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe('{"a":1}');
  });

  it("throws the server's message on an error response", async () => {
    respond(400, { error: "title: expected string", issues: [{ path: "title" }] });
    const err = await apiFetch("/api/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("title: expected string");
    expect(err.status).toBe(400);
    expect(err.issues).toHaveLength(1);
  });

  it("falls back to the given message when the server sends none", async () => {
    respond(500);
    await expect(apiFetch("/api/x", { fallbackMessage: "Failed to save." })).rejects.toThrow(
      "Failed to save."
    );
  });

  it("turns a network failure into a readable message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    await expect(apiFetch("/api/x")).rejects.toThrow(/Network error/);
  });

  it("lets an aborted request through untouched", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("aborted", "AbortError"); }));
    const err = await apiFetch("/api/x").catch((e) => e);
    expect(err.name).toBe("AbortError");
  });
});
