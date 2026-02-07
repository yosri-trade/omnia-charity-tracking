import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { AppError } from './error.middleware.js';

/**
 * Vérifie le JWT et attache l'utilisateur à req.user.
 * Attend le header: Authorization: Bearer <token>
 */
export const protect = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
    if (!token) {
      throw new AppError('Accès refusé. Token manquant.', 401);
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('Utilisateur associé au token introuvable.', 401);
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError(err.name === 'TokenExpiredError' ? 'Token expiré.' : 'Token invalide.', 401));
    }
    next(err);
  }
};
