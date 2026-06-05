/**
 * Application error hierarchy.
 *
 * Domain layer THROWS these. Server Actions CATCH them and convert
 * to user-friendly messages in pt-BR.
 *
 * See CODING_STANDARDS.md §5.4.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, "NOT_FOUND");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly issues: unknown,
  ) {
    super(message, "VALIDATION_ERROR");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT");
  }
}

// --- Domain-specific errors (add as needed) ---

export class InvalidMatchStateTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(`invalid match transition: ${from} → ${to}`, "INVALID_MATCH_TRANSITION");
  }
}

export class PeladaFullError extends AppError {
  constructor() {
    super("pelada is at full capacity", "PELADA_FULL");
  }
}

export class RefereeAlreadyActiveError extends AppError {
  constructor(activeRefereeName: string) {
    super(`${activeRefereeName} is already in referee mode`, "REFEREE_ALREADY_ACTIVE");
  }
}

export class EditWindowExpiredError extends AppError {
  constructor() {
    super("edit window (24h after finished) has expired", "EDIT_WINDOW_EXPIRED");
  }
}
