import { Router } from 'express';
import { body } from 'express-validator';
import { authRequired } from '../middleware/authRequired.js';
import { validate } from '../middleware/validate.js';
import { getWallet, topup } from '../controllers/walletController.js';

const router = Router();

router.use(authRequired);

router.get('/', getWallet);

router.post(
  '/topup',
  // Paise: 1 paisa up to ₹50,000 (5,000,000 paise) per call. Strings like "100" are rejected.
  body('amount')
    .isInt({ min: 1, max: 5000000 })
    .withMessage('Top-up must be between ₹0.01 and ₹50,000 (send whole paise)')
    .custom((v) => typeof v === 'number')
    .withMessage('amount must be a number in paise'),
  validate,
  topup,
);

export default router;
