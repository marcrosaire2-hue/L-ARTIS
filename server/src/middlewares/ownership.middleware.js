/**
 * Middleware de propriété : charge le profil Artisan de l'utilisateur
 * connecté (rôle artisan) et l'attache à req.artisan.
 */
const { Artisan } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const requireArtisanProfile = catchAsync(async (req, res, next) => {
  const artisan = await Artisan.findOne({ userId: req.user._id });
  if (!artisan) {
    throw new ApiError(404, 'Aucun profil artisan associé à ce compte');
  }
  req.artisan = artisan;
  next();
});

module.exports = { requireArtisanProfile };
