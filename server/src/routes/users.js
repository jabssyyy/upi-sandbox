import { Router } from 'express';
import { query } from 'express-validator';
import { authRequired } from '../middleware/authRequired.js';
import { validate } from '../middleware/validate.js';
import { lookup } from '../controllers/usersController.js';

const router = Router();

router.get(
  '/lookup',
  authRequired,
  query('upiId').trim().toLowerCase().matches(/^[a-z0-9.]+@sandbox$/).withMessage('Enter a UPI id like name@sandbox'),
  validate,
  lookup,
);

export default router;
