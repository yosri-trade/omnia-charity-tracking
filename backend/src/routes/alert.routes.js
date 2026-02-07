import express from 'express';
import { getAlerts } from '../controllers/alert.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);
router.get('/', restrictTo('ADMIN', 'COORDINATOR'), getAlerts);

export default router;
