import { AppError } from './error.middleware.js';

/**
 * Autorise l'accès uniquement aux rôles fournis.
 * À utiliser après auth.middleware (protect) pour que req.user soit défini.
 *
 * @param {...string} allowedRoles - Rôles autorisés (ex: 'ADMIN', 'COORDINATOR')
 * @returns {Function} Middleware Express
 *
 * Exemple: router.get('/admin-only', protect, authorize('ADMIN'), handler);
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentification requise.', 401));
    }
    const role = req.user.role;
    if (!allowedRoles.includes(role)) {
      return next(new AppError('Droits insuffisants pour cette action.', 403));
    }
    next();
  };
};

/** Alias pour authorize (RBAC restrictTo). */
export const restrictTo = authorize;
