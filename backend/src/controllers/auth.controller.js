import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { AppError } from '../middleware/error.middleware.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

/**
 * POST /auth/register
 * Crée un nouvel utilisateur (email unique, mot de passe hashé).
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email: email?.trim()?.toLowerCase() });
    if (existing) {
      throw new AppError("Un compte existe déjà avec cet email.", 400);
    }
    // Inscription publique : rôle toujours VOLUNTEER (seul un admin peut créer coordinator/admin via POST /api/users)
    const user = await User.create({
      name: name?.trim(),
      email: email?.trim()?.toLowerCase(),
      password,
      role: 'VOLUNTEER',
    });
    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/login
 * Authentification par email + mot de passe, retourne un JWT.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email et mot de passe requis.', 400);
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Identifiants incorrects.', 401);
    }
    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/me
 * Retourne l'utilisateur connecté (route protégée par auth middleware).
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('Utilisateur non trouvé.', 404);
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};
