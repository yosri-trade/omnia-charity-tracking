import express from 'express';
import { createUser, getVolunteers } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);
router.get('/volunteers', restrictTo('ADMIN', 'COORDINATOR'), getVolunteers);
router.post('/', restrictTo('ADMIN'), createUser);

export default router;
