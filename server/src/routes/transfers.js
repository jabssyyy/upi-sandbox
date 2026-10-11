import { Router } from 'express';
import { body, query } from 'express-validator';
import { authRequired } from '../middleware/authRequired.js';
import { validate } from '../middleware/validate.js';
import { fraudCheck } from '../middleware/fraudCheck.js';
import { createTransfer, listTransfers } from '../controllers/transfersController.js';

const router = Router();

router.use(authRequired);

// The full pipeline: authRequired (above) -> validate -> fraudCheck -> createTransfer
router.post(
  '/',
  body('toUpiId').trim().toLowerCase().matches(/^[a-z0-9.]+@sandbox$/).withMessage('Enter a UPI id like name@sandbox'),
  body('amount')
    .custom((v) => Number.isInteger(v) && v > 0)
    .withMessage('amount must be a whole number of paise, greater than 0'),
  body('note').optional().isString().trim().isLength({ max: 60 }).withMessage('Note can be at most 60 characters'),
  validate,
  fraudCheck,
  createTransfer,
);

// Format first, then a real calendar date (catches 2026-02-30). bail() stops at the first failure.
const day = (name) => {
  const msg = `${name} must be a date like 2026-10-11`;
  return query(name).optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(msg).bail().isISO8601({ strict: true }).withMessage(msg);
};

router.get(
  '/',
  query('status').optional().isIn(['success', 'blocked']).withMessage('status must be success or blocked'),
  day('from'),
  day('to'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be 1 or more').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1 to 50').toInt(),
  validate,
  listTransfers,
);

export default router;
