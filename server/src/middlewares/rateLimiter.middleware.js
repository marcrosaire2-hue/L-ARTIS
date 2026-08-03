/**
 * Rate limiting : protection contre les abus et attaques par force brute.
 * - Limiteur général sur toute l'API
 * - Limiteur strict sur les routes d'authentification
 */
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMin * 60 * 1000,
  max: env.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Trop de requêtes. Veuillez réessayer plus tard.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
  },
});

module.exports = { generalLimiter, authLimiter };
