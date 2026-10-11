import { AppError } from '../utils/AppError.js';

// Must run after authRequired, which sets req.user.
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    throw new AppError('FORBIDDEN', 403, 'Admins only');
  }
  next();
}
