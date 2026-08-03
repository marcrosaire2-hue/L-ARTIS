/**
 * Routes avis.
 * Client : création d'avis (après devis terminé).
 * Artisan : réponse publique à un avis.
 * Public : consultation des avis d'un artisan.
 */
const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate.middleware');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { requireArtisanProfile } = require('../middlewares/ownership.middleware');
const { reviewValidation } = require('../validation');
const reviewController = require('../controllers/review.controller');

router.post('/', protect, authorize('client'), validate(reviewValidation.create), reviewController.createReview);
router.put('/:id/reply', protect, authorize('artisan'), requireArtisanProfile, validate(reviewValidation.reply), reviewController.replyToReview);

module.exports = router;
