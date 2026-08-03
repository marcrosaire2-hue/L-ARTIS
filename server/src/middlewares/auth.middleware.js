/**
 * Middlewares d'authentification et d'autorisation.
 *
 * protect  : vérifie le Bearer access token et charge l'utilisateur.
 * authorize : restreint l'accès à certains rôles.
 */
const { verifyAccessToken } = require('../services/token.service');
const { User, Admin } = require('../models');
const { ACCOUNT_STATUS } = require('../constants');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Authentification requise');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    throw new ApiError(401, 'Token invalide ou expiré, reconnectez-vous');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'Utilisateur introuvable');
  }
  if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw new ApiError(403, 'Votre compte est suspendu');
  }
  if (user.accountStatus === ACCOUNT_STATUS.DELETED) {
    throw new ApiError(401, 'Compte désactivé');
  }

  req.user = user;
  req.tokenPayload = payload;
  next();
});

/**
 * authorize('admin', 'artisan') : seul un de ces rôles accède à la route.
 */
const authorize = (...roles) =>
  catchAsync(async (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'Accès refusé : permission insuffisante');
    }
    next();
  });

/**
 * requireAdmin : vérifie que l'utilisateur dispose d'un profil Admin actif
 * (en plus du rôle user.role === 'admin').
 */
const requireAdmin = catchAsync(async (req, res, next) => {
  const admin = await Admin.findOne({ userId: req.user._id });
  if (!admin || !admin.isActive) {
    throw new ApiError(403, 'Accès réservé aux administrateurs');
  }
  req.admin = admin;
  next();
});

module.exports = { protect, authorize, requireAdmin };
