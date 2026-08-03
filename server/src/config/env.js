/**
 * Validation centralisée des variables d'environnement.
 * Le serveur refuse de démarrer si une variable critique manque
 * ou est invalide (fail-fast, KISS).
 */
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',
  // Aperçu web d'Expo pendant le développement. L'application native
  // n'envoie pas d'en-tête Origin et n'est pas concernée par CORS.
  mobileWebUrl: process.env.MOBILE_WEB_URL || '',
  // Deep links app native (expo-router scheme). Ex. lartis://verification-email?token=
  appDeepLinkBase: process.env.APP_DEEP_LINK_BASE || 'lartis://',
  mongoUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'artisans-marketplace-api',
  },
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Artisans Marketplace <no-reply@example.com>',
  },
  rateLimit: {
    windowMin: parseInt(process.env.RATE_LIMIT_WINDOW_MIN, 10) || 15,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 300,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  },
  uploads: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
  },
};

module.exports = env;
