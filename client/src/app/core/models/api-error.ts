import { HttpErrorResponse } from '@angular/common/http';
import { RuleKey } from './rule';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'FRAUD_BLOCKED'
  | 'INSUFFICIENT_BALANCE'
  | 'NOT_FOUND'
  | 'SERVER_ERROR';

// The one error shape every failing API call returns.
export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    rule?: RuleKey; // only for FRAUD_BLOCKED
    details?: { field: string; message: string }[]; // only for VALIDATION_ERROR
  };
}

// Pulls our error body out of an HttpClient error, or null if it isn't one of ours.
export function apiErrorBody(err: unknown): ApiError['error'] | null {
  if (err instanceof HttpErrorResponse && err.error && typeof err.error === 'object' && 'error' in err.error) {
    return (err.error as ApiError).error;
  }
  return null;
}

// A message that is always safe to show the user.
export function apiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse && err.status === 0) {
    return 'Cannot reach the server. Is it running on port 3000?';
  }
  return apiErrorBody(err)?.message ?? 'Something went wrong. Please try again.';
}
