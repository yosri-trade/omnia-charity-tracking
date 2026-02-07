import express from 'express';
import {
  getAllItems,
  createItem,
  updateStock,
  deleteItem,
} from '../controllers/item.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', restrictTo('ADMIN', 'COORDINATOR'), getAllItems);
router.post('/', restrictTo('ADMIN', 'COORDINATOR'), createItem);
router.patch('/:id/stock', restrictTo('ADMIN', 'COORDINATOR'), updateStock);
router.delete('/:id', restrictTo('ADMIN', 'COORDINATOR'), deleteItem);

export default router;
