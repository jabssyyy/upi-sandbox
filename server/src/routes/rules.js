import { Router } from 'express';
import { body, param } from 'express-validator';
import { authRequired } from '../middleware/authRequired.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { validate } from '../middleware/validate.js';
import { RULE_KEYS, checkParams } from '../rules/index.js';
import { listRules, updateRule, simulateTransfer } from '../controllers/rulesController.js';

const router = Router();

// Every route in this file is admin-only: log in first, then be an admin.
router.use(authRequired, requireAdmin);

router.get('/', listRules);

router.put(
  '/:key',
  param('key').isIn(RULE_KEYS).withMessage(`Rule key must be one of ${RULE_KEYS.join(', ')}`),
  body('enabled').optional().isBoolean({ strict: true }).withMessage('enabled must be true or false'),
  body('params')
    .optional()
    .custom((params, { req }) => {
      const problem = checkParams(req.params.key, params);
      if (problem) throw new Error(problem);
      return true;
    }),
  body().custom((b) => b?.enabled !== undefined || b?.params !== undefined).withMessage('Send enabled and/or params'),
  validate,
  updateRule,
);

// Dry run: what would happen if fromUpiId sent amount to toUpiId right now? Writes nothing.
const upiId = (field) =>
  body(field).trim().toLowerCase().matches(/^[a-z0-9.]+@sandbox$/).withMessage(`${field} must be a UPI id like name@sandbox`);

router.post(
  '/simulate',
  upiId('fromUpiId'),
  upiId('toUpiId'),
  body('amount')
    .custom((v) => Number.isInteger(v) && v > 0)
    .withMessage('amount must be a whole number of paise, greater than 0'),
  validate,
  simulateTransfer,
);

export default router;
