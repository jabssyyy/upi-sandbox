// One error type for the whole app. Throw it anywhere; errorHandler formats it.
export class AppError extends Error {
  constructor(code, status, message, extra = {}) {
    super(message);
    this.code = code; // e.g. 'NOT_FOUND', 'FRAUD_BLOCKED'
    this.status = status; // HTTP status, e.g. 404
    this.extra = extra; // optional fields such as { rule: 'NEW_PAYEE_CAP' }
  }
}
