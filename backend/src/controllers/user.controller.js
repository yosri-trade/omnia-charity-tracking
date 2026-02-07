import User from '../models/User.model.js';
import { AppError } from '../middleware/error.middleware.js';
import asyncHandler from 'express-async-handler';

const ROLES = ['VOLUNTEER', 'COORDINATOR', 'ADMIN'];

/**
 * POST /users - Créer un utilisateur (admin uniquement)
 * Body: name, email, password, role (optionnel, default VOLUNTEER)
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    throw new AppError('Nom, email et mot de passe requis.', 400);
  }
  const normalizedRole = role && ROLES.includes(role.toUpperCase()) ? role.toUpperCase() : 'VOLUNTEER';
  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    throw new AppError('Un compte existe déjà avec cet email.', 400);
  }
  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: normalizedRole,
  });
  res.status(201).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/**
 * GET /users/volunteers - Liste des bénévoles (ID + nom) pour assignation des visites
 */
export const getVolunteers = asyncHandler(async (req, res) => {
  const volunteers = await User.find({ role: 'VOLUNTEER' })
    .select('_id name')
    .sort({ name: 1 })
    .lean();
  res.json({ success: true, data: volunteers });
});
