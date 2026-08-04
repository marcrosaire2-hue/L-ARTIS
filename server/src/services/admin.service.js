/**
 * Service administration — validation des artisans, gestion des
 * utilisateurs, modération des avis.
 */
const crypto = require('crypto');
const { Artisan, User, Review, Session, Admin, Client } = require('../models');
const ApiError = require('../utils/ApiError');
const { ACCOUNT_STATUS, ARTISAN_STATUS, REVIEW_STATUS, PAGINATION, ROLES } = require('../constants');
const ROLES_ADMIN = ROLES.ADMIN;
const { notifyUser, notifyAdmins } = require('./notification.service');
/** Neutralise les métacaractères d'une saisie utilisateur avant $regex. */
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const { sendEmail } = require('./email.service');
const { artisanStatusTemplate, welcomeTemplate } = require('../helpers/email/templates');
const { revokeAllSessions } = require('./auth.service');
const { purgeUserData } = require('./account.service');

/* ------------------------------------------------------------------ */
/* Artisans : validation & suspension                                  */
/* ------------------------------------------------------------------ */

async function listArtisans({ status, q, page = 1, limit = PAGINATION.DEFAULT_LIMIT }) {
  const filters = {};
  if (status) filters.status = status;
  if (q) filters.$text = { $search: String(q) };

  return Artisan.paginate({
    page,
    limit,
    filters,
    sort: { createdAt: -1 },
    populate: [{ path: 'userId', select: 'firstName lastName email phone accountStatus' }],
  });
}

/**
 * Valide / rejette / suspend un artisan (décision d'un admin).
 */
async function setArtisanStatus(artisanId, adminId, { status, reason = '' }) {
  const artisan = await Artisan.findById(artisanId).populate('userId');
  if (!artisan) throw new ApiError(404, 'Artisan introuvable');

  if (![ARTISAN_STATUS.VALIDATED, ARTISAN_STATUS.REJECTED, ARTISAN_STATUS.SUSPENDED].includes(status)) {
    throw new ApiError(422, 'Statut invalide (validated | rejected | suspended)');
  }

  artisan.status = status;
  artisan.validationBy = adminId;
  artisan.validatedAt = status === ARTISAN_STATUS.VALIDATED ? new Date() : artisan.validatedAt;
  artisan.rejectionReason = status === ARTISAN_STATUS.REJECTED ? reason : '';

  if (status === ARTISAN_STATUS.SUSPENDED) {
    artisan.rejectionReason = reason;
    await revokeAllSessions(artisan.userId._id, 'artisan_suspended');
    await User.updateOne(
      { _id: artisan.userId._id },
      { $set: { accountStatus: ACCOUNT_STATUS.SUSPENDED, suspendedAt: new Date(), suspensionReason: reason } }
    );
  } else if (artisan.status === ARTISAN_STATUS.VALIDATED) {
    await User.updateOne(
      { _id: artisan.userId._id },
      { $set: { accountStatus: ACCOUNT_STATUS.ACTIVE } }
    );
  }

  await artisan.save();

  // Notification + e-mail à l'artisan
  const title =
    status === ARTISAN_STATUS.VALIDATED
      ? 'Votre profil est publié !'
      : status === ARTISAN_STATUS.REJECTED
        ? 'Votre profil a été refusé'
        : 'Votre profil a été suspendu';

  await notifyUser(
    artisan.userId._id,
    'artisan_validated',
    title,
    reason || (status === ARTISAN_STATUS.VALIDATED ? 'Votre fiche est désormais visible par les clients.' : ''),
    { artisanId: artisan.artisanId }
  );

  // Bienvenue uniquement à la validation ; refus / suspension gardent le mail de statut.
  if (status === ARTISAN_STATUS.VALIDATED) {
    await sendEmail({
      to: artisan.userId.email,
      subject: 'Bienvenue sur L-ARTIS',
      html: welcomeTemplate(artisan.userId.firstName, 'artisan'),
    });
  } else {
    await sendEmail({
      to: artisan.userId.email,
      subject: title,
      html: artisanStatusTemplate(artisan.userId.firstName, status, reason),
    });
  }

  return artisan;
}

/* ------------------------------------------------------------------ */
/* Utilisateurs                                                        */
/* ------------------------------------------------------------------ */

async function listUsers({ role, status, q, page = 1, limit = PAGINATION.DEFAULT_LIMIT }) {
  const filters = {};
  if (role) filters.role = role;
  if (status) filters.accountStatus = status;
  if (q) {
    // La saisie part dans un $regex : sans échappement, un « + » ou une
    // parenthèse (fréquents dans un numéro) produit une expression invalide
    // et MongoDB répond 500.
    const safe = escapeRegex(q);
    const digits = q.replace(/\D/g, '');

    filters.$or = [
      { firstName: { $regex: safe, $options: 'i' } },
      { lastName: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
      // Recherche par numéro uniquement si la saisie contient des chiffres :
      // une chaîne vide donnerait une regex qui matche TOUS les comptes.
      ...(digits ? [{ phone: { $regex: digits } }] : []),
    ];
  }

  const result = await User.paginate({
    page,
    limit,
    filters,
    sort: { createdAt: -1 },
    select: '-emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires',
  });

  // Enrichissement artisan/client
  const ids = result.items.map((u) => u._id);
  const [artisans, clients] = await Promise.all([
    Artisan.find({ userId: { $in: ids } }).select('userId status artisanId').lean(),
    Client.find({ userId: { $in: ids } }).lean(),
  ]);
  const artisanMap = new Map(artisans.map((a) => [String(a.userId), a]));
  const clientMap = new Map(clients.map((c) => [String(c.userId), c]));

  result.items = result.items.map((u) => ({
    ...u.toJSON(),
    profile: u.role === 'artisan' ? artisanMap.get(String(u._id)) || null : u.role === 'client' ? clientMap.get(String(u._id)) || null : null,
  }));

  return result;
}

/**
 * Suspend / réactive / supprime (soft) un compte utilisateur.
 */
async function setUserStatus(userId, { status, reason = '' }) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Utilisateur introuvable');

  if (status === ACCOUNT_STATUS.SUSPENDED) {
    user.accountStatus = ACCOUNT_STATUS.SUSPENDED;
    user.suspendedAt = new Date();
    user.suspensionReason = reason;
    await revokeAllSessions(userId, 'admin_suspend');
  } else if (status === ACCOUNT_STATUS.ACTIVE) {
    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    user.suspendedAt = undefined;
    user.suspensionReason = '';
    // Un artisan suspendu redevient publié lors de la réactivation
    await Artisan.updateOne(
      { userId, status: ARTISAN_STATUS.SUSPENDED },
      { $set: { status: ARTISAN_STATUS.VALIDATED } }
    );
  } else if (status === ACCOUNT_STATUS.DELETED) {
    user.accountStatus = ACCOUNT_STATUS.DELETED;
    await revokeAllSessions(userId, 'admin_delete');
  } else {
    throw new ApiError(422, 'Statut invalide (active | suspended | deleted)');
  }

  await user.save();
  return user;
}

/**
 * Permissions par défaut selon le niveau admin (aligné sur createAdmin.js).
 */
function permissionsFor(roleAdmin) {
  if (roleAdmin === 'moderator') {
    return {
      users: false,
      artisans: false,
      categories: false,
      reviews: true,
      reports: true,
      quotes: false,
      statistics: false,
      settings: false,
    };
  }
  if (roleAdmin === 'manager') {
    return {
      users: true,
      artisans: true,
      categories: true,
      reviews: true,
      reports: true,
      quotes: false,
      statistics: false,
      settings: false,
    };
  }
  return {
    users: true,
    artisans: true,
    categories: true,
    reviews: true,
    reports: true,
    quotes: true,
    statistics: true,
    settings: true,
  };
}

/**
 * Liste des profils administrateurs (User + rôle admin).
 */
async function listAdmins() {
  const admins = await Admin.find()
    .sort({ createdAt: -1 })
    .populate('userId', 'firstName lastName email accountStatus isEmailVerified createdAt lastLoginAt');

  return admins
    .filter((admin) => admin.userId)
    .map((admin) => {
      const userDoc = admin.userId;
      const user = userDoc.toPublicJSON
        ? { ...userDoc.toPublicJSON(), lastLoginAt: userDoc.lastLoginAt }
        : {
            id: userDoc._id,
            email: userDoc.email,
            firstName: userDoc.firstName,
            lastName: userDoc.lastName,
            fullName: `${userDoc.firstName} ${userDoc.lastName}`,
            accountStatus: userDoc.accountStatus,
            isEmailVerified: userDoc.isEmailVerified,
            createdAt: userDoc.createdAt,
            lastLoginAt: userDoc.lastLoginAt,
          };

      return {
        id: admin._id,
        roleAdmin: admin.roleAdmin,
        permissions: admin.permissions,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        user,
      };
    });
}

/**
 * Crée un compte administrateur (réservé aux super-admins).
 */
async function createAdmin(actorAdmin, { email, password, firstName, lastName, roleAdmin = 'manager' }) {
  if (!actorAdmin || actorAdmin.roleAdmin !== 'super') {
    throw new ApiError(403, 'Seul un super-administrateur peut créer un administrateur');
  }

  if (!['super', 'manager', 'moderator'].includes(roleAdmin)) {
    throw new ApiError(422, 'Niveau admin invalide (super | manager | moderator)');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(409, 'Un compte existe déjà avec cette adresse e-mail');
  }

  const user = await User.create({
    email: normalizedEmail,
    password,
    role: ROLES_ADMIN,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    isEmailVerified: true,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  });

  const admin = await Admin.create({
    userId: user._id,
    roleAdmin,
    permissions: permissionsFor(roleAdmin),
  });

  return {
    id: admin._id,
    roleAdmin: admin.roleAdmin,
    permissions: admin.permissions,
    isActive: admin.isActive,
    createdAt: admin.createdAt,
    user: user.toPublicJSON(),
  };
}

/**
 * Suppression définitive d'un utilisateur + profils associés.
 */
async function deleteUserPermanently(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Utilisateur introuvable');

  const snapshot = {
    id: user._id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
  };

  // Même nettoyage que la suppression par l'utilisateur : sans cela, avis,
  // prestations et galeries survivaient au profil et restaient affichés.
  await purgeUserData(userId, user.role);
  await Admin.deleteMany({ userId });
  return snapshot;
}

/**
 * Réinitialisation de secours d'un mot de passe.
 *
 * Le téléphone étant l'identifiant et l'e-mail facultatif, un utilisateur sans
 * e-mail n'a AUCUNE voie de récupération autonome : c'est cette action qui la
 * remplace. Le mot de passe est tiré au hasard plutôt que choisi par l'admin
 * (qui en réutiliserait un faible), renvoyé une seule fois, et toutes les
 * sessions sont fermées pour couper un éventuel accès frauduleux en cours.
 */
async function resetUserPassword(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Utilisateur introuvable');
  if (user.role === ROLES_ADMIN) {
    throw new ApiError(403, 'Un compte administrateur ne se réinitialise pas depuis cette interface');
  }

  const temporaryPassword = generateTemporaryPassword();
  user.password = temporaryPassword;
  await user.save();

  await revokeAllSessions(userId, 'admin_password_reset');

  return { user, temporaryPassword };
}

/** Mot de passe temporaire lisible : majuscule, minuscules et chiffres. */
function generateTemporaryPassword() {
  // Caractères sans ambiguïté visuelle (ni O/0, ni I/l/1) : il sera dicté
  // au téléphone ou envoyé par WhatsApp.
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick = (set) => set[crypto.randomInt(set.length)];
  const rest = Array.from({ length: 7 }, () => pick(upper + lower + digits));
  return [pick(upper), pick(lower), pick(digits), ...rest].join('');
}

/* ------------------------------------------------------------------ */
/* Avis : modération                                                   */
/* ------------------------------------------------------------------ */

async function listReviews({ status, page = 1, limit = PAGINATION.DEFAULT_LIMIT }) {
  const filters = {};
  if (status) filters.status = status;

  return Review.paginate({
    page,
    limit,
    filters,
    sort: { createdAt: -1 },
    populate: [
      { path: 'client', select: 'firstName lastName email' },
      { path: 'artisan', select: 'artisanId displayName' },
    ],
  });
}

async function setReviewStatus(reviewId, adminId, status) {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Avis introuvable');

  if (![REVIEW_STATUS.APPROVED, REVIEW_STATUS.HIDDEN].includes(status)) {
    throw new ApiError(422, 'Statut invalide (approved | hidden)');
  }

  review.status = status;
  review.moderationBy = adminId;
  review.moderatedAt = new Date();
  await review.save();

  // Recalcul de la note de l'artisan
  const { recalculateRating } = require('./review.service');
  await recalculateRating(review.artisan);

  if (status === REVIEW_STATUS.APPROVED) {
    const artisan = await Artisan.findById(review.artisan);
    if (artisan) {
      await notifyUser(
        artisan.userId,
        'review_new',
        'Un avis a été publié sur votre profil',
        `Note : ${review.rating}/5 — ${review.comment.slice(0, 80)}...`,
        { reviewId: review._id }
      );
    }
  }

  return review;
}

/* ------------------------------------------------------------------ */
/* Notifications admin                                                 */
/* ------------------------------------------------------------------ */

/**
 * Notifie les admins d'un nouvel artisan à valider.
 */
async function notifyAdminsNewArtisan(artisan) {
  await notifyAdmins(
    'artisan_validated',
    'Nouvel artisan à valider',
    `${artisan.displayName} a soumis son profil`,
    { artisanId: String(artisan._id), url: '/admin/artisans' }
  );
}

module.exports = {
  listArtisans,
  setArtisanStatus,
  listUsers,
  setUserStatus,
  listAdmins,
  createAdmin,
  deleteUserPermanently,
  resetUserPassword,
  listReviews,
  setReviewStatus,
  notifyAdminsNewArtisan,
};
