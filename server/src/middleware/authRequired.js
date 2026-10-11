import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

// Expects "Authorization: Bearer <token>". On success, sets req.user to the user document.
export async function authRequired(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError('UNAUTHENTICATED', 401, 'Please log in');
  }

  let payload;
  try {
    // Checks the signature (made with our secret) and the expiry time.
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError('UNAUTHENTICATED', 401, 'Session expired or invalid, please log in again');
  }

  // Load the user fresh, so a deleted user or a changed role takes effect immediately.
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('UNAUTHENTICATED', 401, 'Account no longer exists');

  req.user = user;
  next();
}
