/**
 * Errors the studio API reports to the caller as they are (status + message).
 * Any other error becomes a generic 500 and is only logged (see
 * withStudioAuth in lib/studio-auth.js).
 */
export class StudioError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "StudioError";
    this.status = status;
  }
}

/** The request is malformed or a value is out of range: 400. */
export class InputError extends StudioError {
  constructor(message, issues = []) {
    super(message, 400);
    this.name = "InputError";
    this.issues = issues;
  }
}

/** The thing to change does not exist: 404. */
export class NotFoundError extends StudioError {
  constructor(message = "Not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}
