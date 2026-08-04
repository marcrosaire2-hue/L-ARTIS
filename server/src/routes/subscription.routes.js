/**
 * Routes abonnements artisans.
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate.middleware');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { requireArtisanProfile } = require('../middlewares/ownership.middleware');
const subscriptionController = require('../controllers/subscription.controller');

router.get('/plans', subscriptionController.listPlans);

router.get(
  '/me',
  protect,
  authorize('artisan'),
  requireArtisanProfile,
  subscriptionController.getMine
);

router.post(
  '/me',
  protect,
  authorize('artisan'),
  requireArtisanProfile,
  validate([
    body('plan').isIn(['basic', 'pro', 'business']),
    body('period').optional().isIn(['monthly', 'yearly']),
  ]),
  subscriptionController.subscribe
);

router.delete(
  '/me',
  protect,
  authorize('artisan'),
  requireArtisanProfile,
  subscriptionController.cancel
);

module.exports = router;
