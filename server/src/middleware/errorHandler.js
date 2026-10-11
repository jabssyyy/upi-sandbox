import { AppError } from '../utils/AppError.js';

// Express knows this is the error handler because it takes 4 arguments.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...err.extra },
    });
  }

  // express.json() throws this when the request body is not valid JSON.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON' },
    });
  }

  // MongoDB refused a duplicate value on a unique index (e.g. two signups with one email at once).
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'value';
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: `That ${field} is already in use` },
    });
  }

  // Anything else is a bug: log the details, but don't leak them to the client.
  console.error(err);
  res.status(500).json({
    error: { code: 'SERVER_ERROR', message: 'Something went wrong' },
  });
}
