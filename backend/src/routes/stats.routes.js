import express from 'express';
import { getStats } from '../controllers/stats.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);
router.get('/', restrictTo('ADMIN', 'COORDINATOR'), getStats);

export default router;
