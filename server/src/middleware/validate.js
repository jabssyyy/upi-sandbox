import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

// Runs after the express-validator checks listed on a route and turns any
// failures into one VALIDATION_ERROR in our shared error shape.
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  throw new AppError('VALIDATION_ERROR', 400, details[0].message, { details });
}
