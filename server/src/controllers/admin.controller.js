/**
 * Contrôleur administration — validation artisans, gestion
 * utilisateurs, modération des avis.
 */
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const adminService = require('../services/admin.service');

const listArtisans = catchAsync(async (req, res) => {
  const data = await adminService.listArtisans(req.query);
  res.json(ApiResponse.ok('Artisans récupérés', data));
});

const setArtisanStatus = catchAsync(async (req, res) => {
  const data = await adminService.setArtisanStatus(
    req.params.id,
    req.user._id,
    req.body
  );
  res.json(ApiResponse.ok('Statut de l\'artisan mis à jour', data));
});

const listUsers = catchAsync(async (req, res) => {
  const data = await adminService.listUsers(req.query);
  res.json(ApiResponse.ok('Utilisateurs récupérés', data));
});

const setUserStatus = catchAsync(async (req, res) => {
  const data = await adminService.setUserStatus(req.params.id, req.body);
  res.json(ApiResponse.ok('Statut utilisateur mis à jour', data));
});

const deleteUser = catchAsync(async (req, res) => {
  await adminService.deleteUserPermanently(req.params.id);
  res.json(ApiResponse.ok('Utilisateur supprimé définitivement'));
});

const resetUserPassword = catchAsync(async (req, res) => {
  const { user, temporaryPassword } = await adminService.resetUserPassword(req.params.id);
  res.json(
    ApiResponse.ok(
      'Mot de passe réinitialisé. Communiquez-le à la personne concernée : il ne sera plus affiché.',
      { phone: user.phone, temporaryPassword }
    )
  );
});

const listReviews = catchAsync(async (req, res) => {
  const data = await adminService.listReviews(req.query);
  res.json(ApiResponse.ok('Avis récupérés', data));
});

const setReviewStatus = catchAsync(async (req, res) => {
  const data = await adminService.setReviewStatus(req.params.id, req.user._id, req.body.status);
  res.json(ApiResponse.ok('Statut de l\'avis mis à jour', data));
});

module.exports = {
  listArtisans,
  setArtisanStatus,
  listUsers,
  setUserStatus,
  deleteUser,
  resetUserPassword,
  listReviews,
  setReviewStatus,
};
