import asyncHandler from 'express-async-handler';
import Item from '../models/Item.model.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * GET / - Récupérer tous les articles
 */
export const getAllItems = asyncHandler(async (req, res) => {
  const items = await Item.find().sort({ category: 1, name: 1 }).lean();
  res.json({ success: true, data: items, count: items.length });
});

/**
 * POST / - Créer un nouvel article
 */
export const createItem = asyncHandler(async (req, res) => {
  const item = await Item.create(req.body);
  res.status(201).json({ success: true, data: item });
});

/**
 * PATCH /:id/stock - Ajuster le stock (delta positif ou négatif)
 */
export const updateStock = asyncHandler(async (req, res) => {
  const { delta } = req.body;
  const numDelta = Number(delta);
  if (Number.isNaN(numDelta)) {
    throw new AppError('Le delta doit être un nombre.', 400);
  }
  const item = await Item.findById(req.params.id);
  if (!item) {
    throw new AppError('Article non trouvé.', 404);
  }
  const newQuantity = Math.max(0, (item.quantity || 0) + numDelta);
  item.quantity = newQuantity;
  await item.save();
  res.json({ success: true, data: item });
});

/**
 * DELETE /:id - Supprimer un article
 */
export const deleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findByIdAndDelete(req.params.id);
  if (!item) {
    throw new AppError('Article non trouvé.', 404);
  }
  res.json({ success: true, data: null, message: 'Article supprimé.' });
});
