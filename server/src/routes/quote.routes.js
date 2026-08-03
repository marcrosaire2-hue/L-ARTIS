/**
 * Routes devis.
 * Client : création, liste de ses demandes, changement de statut (terminé/annulé).
 * Artisan : liste des devis reçus, réponse (accepté/refusé).
 * Les deux : consultation d'un devis commun.
 */
const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate.middleware');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { requireArtisanProfile } = require('../middlewares/ownership.middleware');
const { quoteValidation } = require('../validation');
const quoteController = require('../controllers/quote.controller');

router.post('/', protect, authorize('client'), validate(quoteValidation.create), quoteController.createQuote);
router.get('/me', protect, validate(quoteValidation.list), quoteController.listMyQuotes);
router.get('/:id', protect, validate(quoteValidation.id), quoteController.getQuote);
router.put('/:id/respond', protect, authorize('artisan'), requireArtisanProfile, validate(quoteValidation.respond), quoteController.respondToQuote);
router.put('/:id/status', protect, authorize('client'), validate(quoteValidation.updateStatus), quoteController.updateQuoteStatus);

module.exports = router;
