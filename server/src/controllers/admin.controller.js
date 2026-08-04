/**
 * Contrôleur administration — validation artisans, gestion
 * utilisateurs, modération des avis, journal d'activité.
 */
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const adminService = require('../services/admin.service');
const activityService = require('../services/activity.service');

const ARTISAN_EFFECT = {
  validated: 'a publié la fiche artisan',
  rejected: 'a refusé la fiche artisan',
  suspended: 'a suspendu la fiche artisan',
};

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
  const ctx = activityService.requestContext(req);
  await activityService.record({
    actorId: req.user._id,
    action: `artisan.${data.status}`,
    targetType: 'artisan',
    targetId: data._id,
    summary: `${ARTISAN_EFFECT[data.status] || 'a mis à jour'} « ${data.displayName} »`,
    meta: {
      status: data.status,
      reason: req.body.reason || '',
      displayName: data.displayName,
    },
    ...ctx,
  });
  res.json(ApiResponse.ok("Statut de l'artisan mis à jour", data));
});

const listUsers = catchAsync(async (req, res) => {
  const data = await adminService.listUsers(req.query);
  res.json(ApiResponse.ok('Utilisateurs récupérés', data));
});

const setUserStatus = catchAsync(async (req, res) => {
  const data = await adminService.setUserStatus(req.params.id, req.body);
  const ctx = activityService.requestContext(req);
  const verb =
    req.body.status === 'suspended'
      ? 'a suspendu le compte'
      : req.body.status === 'active'
        ? 'a réactivé le compte'
        : 'a modifié le statut du compte';
  await activityService.record({
    actorId: req.user._id,
    action: `user.${req.body.status}`,
    targetType: 'user',
    targetId: data._id,
    summary: `${verb} de ${data.firstName} ${data.lastName}`,
    meta: {
      status: req.body.status,
      reason: req.body.reason || '',
      email: data.email,
      phone: data.phone,
      role: data.role,
    },
    ...ctx,
  });
  res.json(ApiResponse.ok('Statut utilisateur mis à jour', data));
});

const deleteUser = catchAsync(async (req, res) => {
  const snapshot = await adminService.deleteUserPermanently(req.params.id);
  const ctx = activityService.requestContext(req);
  await activityService.record({
    actorId: req.user._id,
    action: 'user.deleted',
    targetType: 'user',
    targetId: snapshot.id,
    summary: `a supprimé définitivement le compte de ${snapshot.fullName}`,
    meta: snapshot,
    ...ctx,
  });
  res.json(ApiResponse.ok('Utilisateur supprimé définitivement'));
});

const resetUserPassword = catchAsync(async (req, res) => {
  const { user, temporaryPassword } = await adminService.resetUserPassword(req.params.id);
  const ctx = activityService.requestContext(req);
  await activityService.record({
    actorId: req.user._id,
    action: 'user.password_reset',
    targetType: 'user',
    targetId: user._id,
    summary: `a réinitialisé le mot de passe de ${user.firstName} ${user.lastName}`,
    meta: { phone: user.phone, email: user.email, role: user.role },
    ...ctx,
  });
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
  const ctx = activityService.requestContext(req);
  const verb = req.body.status === 'approved' ? 'a publié un avis' : 'a masqué un avis';
  await activityService.record({
    actorId: req.user._id,
    action: `review.${req.body.status}`,
    targetType: 'review',
    targetId: data._id,
    summary: `${verb} (${data.rating}/5)`,
    meta: {
      status: req.body.status,
      rating: data.rating,
      artisanId: data.artisan,
      commentPreview: String(data.comment || '').slice(0, 120),
    },
    ...ctx,
  });
  res.json(ApiResponse.ok("Statut de l'avis mis à jour", data));
});

const getAdminMe = catchAsync(async (req, res) => {
  res.json(
    ApiResponse.ok('Profil administrateur', {
      roleAdmin: req.admin.roleAdmin,
      permissions: req.admin.permissions,
      isActive: req.admin.isActive,
    })
  );
});

const listAdmins = catchAsync(async (req, res) => {
  const data = await adminService.listAdmins();
  res.json(ApiResponse.ok('Administrateurs récupérés', data));
});

const createAdmin = catchAsync(async (req, res) => {
  const data = await adminService.createAdmin(req.admin, req.body);
  const ctx = activityService.requestContext(req);
  await activityService.record({
    actorId: req.user._id,
    action: 'admin.created',
    targetType: 'admin',
    targetId: data.user.id,
    summary: `a créé l'administrateur ${data.user.firstName} ${data.user.lastName} (${data.roleAdmin})`,
    meta: {
      email: data.user.email,
      roleAdmin: data.roleAdmin,
    },
    ...ctx,
  });
  res.status(201).json(ApiResponse.created('Administrateur créé', data));
});

const listActivities = catchAsync(async (req, res) => {
  const data = await activityService.listActivities(req.query);
  res.json(ApiResponse.ok('Activités récupérées', data));
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
  getAdminMe,
  listAdmins,
  createAdmin,
  listActivities,
};
