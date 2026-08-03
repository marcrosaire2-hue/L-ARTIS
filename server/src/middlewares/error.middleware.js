/**
 * Middleware centralisé de gestion des erreurs.
 * - Détecte les erreurs Mongoose (ValidationError, CastError, duplicate key)
 * - Détecte les erreurs JWT (TokenExpiredError, JsonWebTokenError)
 * - Journalise toutes les erreurs
 * - Répond en JSON sans jamais exposer la stack en production
 */
const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route introuvable : ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Erreur interne du serveur';

    error = new ApiError(statusCode, message, error.errors || undefined);
    error.isOperational = false;
  }

  // Erreurs Mongoose
  if (err.name === 'CastError') {
    error = new ApiError(400, `Valeur invalide pour le champ ${err.path}`);
  }
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, 'Données invalides', details);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'champ';
    error = new ApiError(409, `Le champ « ${field} » existe déjà`);
  }

  // Erreurs JWT
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expiré, veuillez vous reconnecter');
  }
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Token invalide');
  }

  // Payload JSON invalide
  if (err.type === 'entity.parse.failed') {
    error = new ApiError(400, 'JSON mal formé dans le corps de la requête');
  }

  if (error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} -> ${error.message}`, {
      stack: error.stack,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} -> ${error.statusCode} ${error.message}`);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
  };
  if (error.details) response.details = error.details;
  if (!env.isProduction) response.stack = error.stack;

  res.status(error.statusCode).json(response);
};

module.exports = { notFoundHandler, errorHandler };
