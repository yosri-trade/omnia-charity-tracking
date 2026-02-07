/**
 * Erreur applicative avec code HTTP.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Gestion centralisée des erreurs Express.
 * À placer en dernier middleware (après toutes les routes).
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur serveur';

  // Erreur Mongoose : validation
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ; ');
  }

  // Erreur Mongoose : duplicate key (ex: email unique)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern || {})[0] || 'champ';
    message = `Un enregistrement existe déjà pour ce ${field}.`;
  }

  // JWT invalide ou expiré
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré.';
  }

  // CastError (id MongoDB invalide)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Identifiant invalide.';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware pour routes non trouvées (404).
 */
export const notFound = (req, res, next) => {
  next(new AppError(`Route non trouvée: ${req.originalUrl}`, 404));
};
