/**
 * Configuration de l'application Express.
 * Ordre des middlewares (importance critique) :
 *   1. Sécurité (helmet, cors, rate limit)
 *   2. Parsing (json, urlencoded, cookies)
 *   3. Logging (morgan -> winston)
 *   4. Compression
 *   5. Routes
 *   6. 404 + gestion centralisée des erreurs
 */
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const { generalLimiter } = require('./middlewares/rateLimiter.middleware');
const {
  notFoundHandler,
  errorHandler,
} = require('./middlewares/error.middleware');

const app = express();

// --- Sécurité HTTP (XSS, clickjacking, MIME sniffing, CSP...) ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// --- CORS : origines des frontends (env + URLs prod connues) ---
// Les origines codées en dur évitent un 500 navigateur si ADMIN_URL /
// CLIENT_URL sont absents ou obsolètes sur Render.
const normalizeOrigin = (url) => (url || '').trim().replace(/\/$/, '');
const allowedOrigins = [
  ...new Set(
    [
      env.clientUrl,
      env.adminUrl,
      env.mobileWebUrl,
      'https://lartis-client-fx8k.onrender.com',
      'https://lartis-admin-jmii.onrender.com',
      'http://localhost:5173',
      'http://localhost:5174',
    ]
      .map(normalizeOrigin)
      .filter(Boolean)
  ),
];
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      // Ne pas throw : sinon le navigateur voit un 500 sans
      // Access-Control-Allow-Origin (message CORS trompeur).
      logger.warn(`CORS refusé pour origine : ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // X-Client-Type distingue l'application native du navigateur (le refresh
    // token lui est renvoyé dans le corps). Sans cette entrée, le préflight
    // échoue et TOUTES les requêtes du client mobile sont bloquées.
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Type'],
  })
);

// --- Parsing ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// --- Fichiers statiques uploadés (images/vidéos des artisans) ---
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, 'uploads'), { maxAge: '7d' })
);

// --- Logging HTTP (au format Apache, journalisé via Winston) ---
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => env.isProduction && req.path === '/api/v1/health',
  })
);

// --- Compression des réponses ---
app.use(compression());

// --- Rate limiting global ---
app.use('/api', generalLimiter);

// --- Routes ---
app.use(env.apiPrefix, routes);

// --- 404 et erreurs ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
