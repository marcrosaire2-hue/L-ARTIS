/**
 * Contrôleur artisans — recherche, fiche publique, profil propriétaire,
 * réalisations, statistiques.
 */
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const artisanService = require('../services/artisan.service');

const searchArtisans = catchAsync(async (req, res) => {
  const data = await artisanService.searchArtisans(req.query);
  res.json(ApiResponse.ok('Artisans récupérés', data));
});

const getPublicProfile = catchAsync(async (req, res) => {
  const data = await artisanService.getPublicProfile(req.params.artisanId);
  res.json(ApiResponse.ok('Profil artisan récupéré', data));
});

const getMyProfile = catchAsync(async (req, res) => {
  res.json(ApiResponse.ok('Profil récupéré', { artisan: req.artisan }));
});

const updateMyProfile = catchAsync(async (req, res) => {
  const artisan = await artisanService.updateProfile(req.artisan._id, req.body);
  res.json(ApiResponse.ok('Profil mis à jour', { artisan }));
});

/* --- Réalisations --- */

const listMyServices = catchAsync(async (req, res) => {
  const data = await artisanService.listServices(req.artisan._id);
  res.json(ApiResponse.ok('Réalisations récupérées', data));
});

const createMyService = catchAsync(async (req, res) => {
  const data = await artisanService.createService(req.artisan._id, req.body);
  res.status(201).json(ApiResponse.created('Réalisation publiée', data));
});

const updateMyService = catchAsync(async (req, res) => {
  const data = await artisanService.updateService(req.artisan._id, req.params.id, req.body);
  res.json(ApiResponse.ok('Réalisation mise à jour', data));
});

const deleteMyService = catchAsync(async (req, res) => {
  await artisanService.deleteService(req.artisan._id, req.params.id);
  res.json(ApiResponse.ok('Réalisation supprimée'));
});

/* --- Statistiques --- */

const getMyStats = catchAsync(async (req, res) => {
  const data = await artisanService.getDashboardStats(req.artisan._id);
  res.json(ApiResponse.ok('Statistiques récupérées', data));
});

module.exports = {
  searchArtisans,
  getPublicProfile,
  getMyProfile,
  updateMyProfile,
  listMyServices,
  createMyService,
  updateMyService,
  deleteMyService,
  getMyStats,
};
