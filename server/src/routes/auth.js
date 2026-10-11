import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authRequired } from '../middleware/authRequired.js';
import { register, login, me } from '../controllers/authController.js';

const router = Router();

const emailCheck = body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email');

router.post(
  '/register',
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name is too long'),
  emailCheck,
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
  register,
);

router.post(
  '/login',
  emailCheck,
  body('password').notEmpty().withMessage('Password is required'),
  validate,
  login,
);

router.get('/me', authRequired, me);

export default router;
