/**
 * Contrôleur avis.
 */
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const reviewService = require('../services/review.service');

const createReview = catchAsync(async (req, res) => {
  const data = await reviewService.createReview(req.user._id, req.body);
  res.status(201).json(
    ApiResponse.created('Avis envoyé. Il sera publié après validation.', data)
  );
});

const replyToReview = catchAsync(async (req, res) => {
  const data = await reviewService.replyToReview(req.params.id, req.artisan._id, req.body.text);
  res.json(ApiResponse.ok('Réponse publiée', data));
});

const listArtisanReviews = catchAsync(async (req, res) => {
  const data = await reviewService.listArtisanReviews(req.params.artisanId, req.query);
  res.json(ApiResponse.ok('Avis récupérés', data));
});

module.exports = { createReview, replyToReview, listArtisanReviews };
