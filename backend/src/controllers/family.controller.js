import asyncHandler from 'express-async-handler';
import Family from '../models/Family.model.js';
import Visit from '../models/Visit.model.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * POST / - Créer une famille
 */
export const createFamily = asyncHandler(async (req, res) => {
  const family = await Family.create({
    ...req.body,
    createdBy: req.user.id,
  });
  const populated = await Family.findById(family._id).populate('createdBy', 'name email role');
  res.status(201).json({ success: true, data: populated });
});

/**
 * GET / - Lister toutes les familles
 */
export const getFamilies = asyncHandler(async (req, res) => {
  const families = await Family.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email role')
    .lean();
  res.json({ success: true, data: families, count: families.length });
});

/**
 * GET /:id - Détails d'une famille
 */
export const getFamilyById = asyncHandler(async (req, res) => {
  const family = await Family.findById(req.params.id).populate('createdBy', 'name email role');
  if (!family) {
    throw new AppError('Famille non trouvée.', 404);
  }
  res.json({ success: true, data: family });
});

/**
 * PUT /:id - Mettre à jour une famille
 */
export const updateFamily = asyncHandler(async (req, res) => {
  const { createdBy, ...body } = req.body;
  const family = await Family.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  }).populate('createdBy', 'name email role');
  if (!family) {
    throw new AppError('Famille non trouvée.', 404);
  }
  res.json({ success: true, data: family });
});

/**
 * DELETE /:id - Supprimer une famille et ses visites associées
 */
export const deleteFamily = asyncHandler(async (req, res) => {
  const familyId = req.params.id;
  const family = await Family.findById(familyId);
  if (!family) {
    throw new AppError('Famille non trouvée.', 404);
  }
  await Visit.deleteMany({ family: familyId });
  await Family.findByIdAndDelete(familyId);
  res.json({ success: true, data: null, message: 'Famille supprimée.' });
});
