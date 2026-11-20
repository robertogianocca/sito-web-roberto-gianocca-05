/**
 * The one way the studio UI talks to its API.
 *
 * - sends and parses JSON;
 * - on an error response throws ApiError with the server's message (the API
 *   answers `{ error }`, e.g. "title: Invalid input…"), or `fallbackMessage`;
 * - on a network failure throws ApiError with a readable message instead of
 *   a raw TypeError;
 * - an aborted request rethrows the AbortError untouched.
 */
export class ApiError extends Error {
  constructor(message, status = 0, issues = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

export async function apiFetch(url, { method = "GET", body, signal, fallbackMessage } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method,
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new ApiError("Network error: check the connection and try again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      data?.error || fallbackMessage || `Request failed (${res.status}).`,
      res.status,
      data?.issues ?? []
    );
  }
  return data;
}
