/**
 * Routes artisans.
 * Public : recherche + fiche publique + avis.
 * Propriétaire (artisan connecté) : profil, services, galerie, stats, devis reçus.
 */
const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate.middleware');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { requireArtisanProfile } = require('../middlewares/ownership.middleware');
const { artisanValidation, quoteValidation } = require('../validation');
const artisanController = require('../controllers/artisan.controller');
const quoteController = require('../controllers/quote.controller');
const reviewController = require('../controllers/review.controller');

// --- Routes propriétaire (déclarées AVANT /:artisanId) ---
router.get('/me', protect, authorize('artisan'), requireArtisanProfile, artisanController.getMyProfile);
router.put('/me/profile', protect, authorize('artisan'), requireArtisanProfile, validate(artisanValidation.profile), artisanController.updateMyProfile);

router.get('/me/quotes', protect, authorize('artisan'), requireArtisanProfile, validate(quoteValidation.list), quoteController.listArtisanQuotes);
router.get('/me/stats', protect, authorize('artisan'), requireArtisanProfile, artisanController.getMyStats);

router.get('/me/services', protect, authorize('artisan'), requireArtisanProfile, artisanController.listMyServices);
router.post('/me/services', protect, authorize('artisan'), requireArtisanProfile, validate(artisanValidation.serviceCreate), artisanController.createMyService);
router.put('/services/:id', protect, authorize('artisan'), requireArtisanProfile, validate(artisanValidation.serviceUpdate), artisanController.updateMyService);
router.delete('/services/:id', protect, authorize('artisan'), requireArtisanProfile, validate(artisanValidation.serviceId), artisanController.deleteMyService);

router.put('/me/gallery', protect, authorize('artisan'), requireArtisanProfile, validate(artisanValidation.gallery), artisanController.updateMyGallery);
router.post('/me/gallery/media', protect, authorize('artisan'), requireArtisanProfile, artisanController.addMediaToGallery);
router.delete('/me/gallery/items/:itemId', protect, authorize('artisan'), requireArtisanProfile, artisanController.removeGalleryItem);

// --- Public ---
router.get('/', validate(artisanValidation.search), artisanController.searchArtisans);
router.get('/:artisanId/reviews', validate(artisanValidation.artisanId), reviewController.listArtisanReviews);
router.get('/:artisanId', validate(artisanValidation.artisanId), artisanController.getPublicProfile);

module.exports = router;
