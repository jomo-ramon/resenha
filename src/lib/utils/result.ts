/**
 * Result type — explicit success/failure modeling for the domain layer.
 *
 * Use Result when failure is an expected outcome (validation, business rules).
 * Continue using thrown exceptions for unexpected errors (infra, bugs).
 *
 * See CODING_STANDARDS.md §5.3 and §5.4.
 */

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

/**
 * Unwraps a Result, throwing the error if not ok.
 * Use sparingly — usually you want to handle both branches explicitly.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}
