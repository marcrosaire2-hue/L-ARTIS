/**
 * Contrôleur devis.
 */
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const quoteService = require('../services/quote.service');

const createQuote = catchAsync(async (req, res) => {
  const data = await quoteService.createQuote(req.user._id, req.body);
  res.status(201).json(ApiResponse.created('Demande de devis envoyée', data));
});

const listMyQuotes = catchAsync(async (req, res) => {
  const data = await quoteService.listClientQuotes(req.user._id, req.query);
  res.json(ApiResponse.ok('Vos demandes de devis', data));
});

const listArtisanQuotes = catchAsync(async (req, res) => {
  const data = await quoteService.listArtisanQuotes(req.artisan._id, req.query);
  res.json(ApiResponse.ok('Devis reçus', data));
});

const getQuote = catchAsync(async (req, res) => {
  const data = await quoteService.getQuote(req.params.id, req.user);
  res.json(ApiResponse.ok('Devis récupéré', data));
});

const respondToQuote = catchAsync(async (req, res) => {
  const data = await quoteService.respondToQuote(req.params.id, req.artisan, req.body);
  res.json(ApiResponse.ok('Réponse envoyée au client', data));
});

const updateQuoteStatus = catchAsync(async (req, res) => {
  const data = await quoteService.updateQuoteStatus(req.params.id, req.user._id, req.body);
  res.json(ApiResponse.ok('Statut du devis mis à jour', data));
});

module.exports = {
  createQuote,
  listMyQuotes,
  listArtisanQuotes,
  getQuote,
  respondToQuote,
  updateQuoteStatus,
};
