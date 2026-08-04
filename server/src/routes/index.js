/**
 * Routeur racine de l'API.
 * Chaque module métier sera branché ici au fil des phases :
 * /auth, /users, /artisans, /categories, /trades, /quotes, ...
 */
const express = require('express');
const router = express.Router();

const { healthCheck } = require('../controllers/health.controller');
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const artisanRoutes = require('./artisan.routes');
const quoteRoutes = require('./quote.routes');
const reviewRoutes = require('./review.routes');
const favoriteRoutes = require('./favorite.routes');
const notificationRoutes = require('./notification.routes');
const uploadRoutes = require('./upload.routes');
const locationRoutes = require('./location.routes');
const adminRoutes = require('./admin.routes');
const conversationRoutes = require('./conversation.routes');
const reportRoutes = require('./report.routes');
const subscriptionRoutes = require('./subscription.routes');

router.get('/health', healthCheck);

// --- Modules métier ---
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/artisans', artisanRoutes);
router.use('/quotes', quoteRoutes);
router.use('/reviews', reviewRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/notifications', notificationRoutes);
router.use('/uploads', uploadRoutes);
router.use('/locations', locationRoutes);
router.use('/conversations', conversationRoutes);
router.use('/reports', reportRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
