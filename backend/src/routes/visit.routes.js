import express from 'express';
import {
  createVisit,
  getVisitById,
  getVisitsByFamily,
  getAllVisits,
  getMyVisits,
  validateVisit,
} from '../controllers/visit.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/my-visits', getMyVisits);
router.get('/', restrictTo('ADMIN', 'COORDINATOR'), getAllVisits);
router.get('/:id', getVisitById);
router.post('/', restrictTo('ADMIN', 'COORDINATOR'), createVisit);
router.patch('/:id/validate', validateVisit);
router.get('/family/:familyId', restrictTo('ADMIN', 'COORDINATOR'), getVisitsByFamily);

export default router;
