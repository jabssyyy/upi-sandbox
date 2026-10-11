import { Router } from 'express';
import { query } from 'express-validator';
import { authRequired } from '../middleware/authRequired.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { validate } from '../middleware/validate.js';
import { listBlocked, stats } from '../controllers/adminController.js';

const router = Router();

router.use(authRequired, requireAdmin);

router.get(
  '/blocked',
  query('page').optional().isInt({ min: 1 }).withMessage('page must be 1 or more').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1 to 100').toInt(),
  validate,
  listBlocked,
);

router.get('/stats', stats);

export default router;
