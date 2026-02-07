import express from 'express';
import {
  createFamily,
  getFamilies,
  getFamilyById,
  updateFamily,
  deleteFamily,
} from '../controllers/family.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/').post(restrictTo('ADMIN', 'COORDINATOR'), createFamily).get(restrictTo('ADMIN', 'COORDINATOR'), getFamilies);
router.route('/:id').get(restrictTo('ADMIN', 'COORDINATOR'), getFamilyById).put(restrictTo('ADMIN', 'COORDINATOR'), updateFamily).delete(restrictTo('ADMIN'), deleteFamily);

export default router;
