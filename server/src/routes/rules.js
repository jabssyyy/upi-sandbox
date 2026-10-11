import { Router } from 'express';
import { authRequired } from '../middleware/authRequired.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { listRules } from '../controllers/rulesController.js';

const router = Router();

// Every route in this file is admin-only: log in first, then be an admin.
router.use(authRequired, requireAdmin);

router.get('/', listRules);

export default router;
