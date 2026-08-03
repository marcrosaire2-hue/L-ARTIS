/**
 * Routes favoris (client).
 */
const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate.middleware');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { favoriteValidation } = require('../validation');
const favoriteController = require('../controllers/favorite.controller');

router.get('/me', protect, authorize('client'), favoriteController.listMyFavorites);
router.post('/', protect, authorize('client'), validate(favoriteValidation.create), favoriteController.addFavorite);
router.delete('/:artisanId', protect, authorize('client'), validate(favoriteValidation.id), favoriteController.removeFavorite);

module.exports = router;
