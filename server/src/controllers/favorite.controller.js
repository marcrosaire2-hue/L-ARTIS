/**
 * Contrôleur favoris.
 */
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const favoriteService = require('../services/favorite.service');

const listMyFavorites = catchAsync(async (req, res) => {
  const data = await favoriteService.listFavorites(req.user._id, req.query);
  res.json(ApiResponse.ok('Favoris récupérés', data));
});

const addFavorite = catchAsync(async (req, res) => {
  const data = await favoriteService.addFavorite(req.user._id, req.body.artisanId);
  res.status(201).json(ApiResponse.created('Artisan ajouté aux favoris', data));
});

const removeFavorite = catchAsync(async (req, res) => {
  await favoriteService.removeFavorite(req.user._id, req.params.artisanId);
  res.json(ApiResponse.ok('Artisan retiré des favoris'));
});

module.exports = { listMyFavorites, addFavorite, removeFavorite };
