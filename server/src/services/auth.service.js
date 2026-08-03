/**
 * Service d'authentification — toute la logique métier d'auth.
 * Sécurité :
 *  - mots de passe bcrypt (12 rounds) via le hook pre-save de User ;
 *  - refresh token haché en base, rotation à chaque usage ;
 *  - détection de réutilisation de refresh token (vol) -> révocation
 *    de toutes les sessions de l'utilisateur ;
 *  - tokens de vérification/reset aléatoires à usage unique avec expiration ;
 *  - anti-énumération : forgotPassword répond toujours OK.
 */
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const slugify = require('../utils/slugify');
const {
  User,
  Artisan,
  Client,
  Session,
} = require('../models');
const env = require('../config/env');
const logger = require('../config/logger');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
} = require('./token.service');
const { sendEmail } = require('./email.service');
const { notifyAdmins } = require('./notification.service');
const {
  verifyEmailTemplate,
  resetPasswordTemplate,
  welcomeTemplate,
} = require('../helpers/email/templates');
const { ROLES, ACCOUNT_STATUS } = require('../constants');
const { normalizePhone, looksLikeEmail } = require('../utils/phone');

const REFRESH_COOKIE = 'refresh_token';
const MAX_ACTIVE_SESSIONS = 10;

/* ------------------------------------------------------------------ */
/* Helpers internes                                                    */
/* ------------------------------------------------------------------ */

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  };
}

function clearCookieOptions() {
  return { httpOnly: true, secure: env.isProduction, sameSite: 'lax', path: '/api/v1/auth' };
}

/**
 * Crée une session (refresh token) pour l'utilisateur.
 */
async function createSession(user, req) {
  await Session.deleteMany({
    user: user._id,
    $or: [{ revokedAt: { $ne: null } }, { expiresAt: { $lt: new Date() } }],
  });

  const activeCount = await Session.countDocuments({ user: user._id, revokedAt: null });
  if (activeCount >= MAX_ACTIVE_SESSIONS) {
    await Session.updateMany(
      { user: user._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'session_limit' } }
    );
  }

  const session = await Session.create({
    user: user._id,
    refreshTokenHash: 'pending',
    ip: req.ip || '',
    userAgent: (req.get('user-agent') || '').slice(0, 500),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    lastUsedAt: new Date(),
  });

  const refreshToken = signRefreshToken(user, session._id.toString());
  session.refreshTokenHash = hashToken(refreshToken);
  await session.save();

  return { session, refreshToken };
}

/**
 * Révoque toutes les sessions actives d'un utilisateur.
 */
async function revokeAllSessions(userId, reason = 'manual') {
  await Session.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  );
}

/**
 * Envoie l'e-mail de vérification + retourne le token (pour champ dev).
 */
async function sendVerificationEmail(user) {
  const token = generateRandomToken();
  user.emailVerificationToken = hashToken(token);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  // Doit correspondre aux routes du site client (client/src/App.jsx)
  const url = `${env.clientUrl}/verification-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Confirmez votre adresse e-mail',
    html: verifyEmailTemplate(url, user.firstName),
  });
  return token;
}

/* ------------------------------------------------------------------ */
/* Inscription                                                         */
/* ------------------------------------------------------------------ */

async function register({ email, password, firstName, lastName, phone, role, artisanData }) {
  if (![ROLES.CLIENT, ROLES.ARTISAN].includes(role)) {
    throw new ApiError(400, 'Rôle invalide : choisir client ou artisan');
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new ApiError(400, 'Le numéro de téléphone est obligatoire');
  }

  if (await User.exists({ phone: normalizedPhone })) {
    throw new ApiError(409, 'Un compte existe déjà avec ce numéro de téléphone');
  }

  const normalizedEmail = email ? String(email).trim().toLowerCase() : undefined;
  if (normalizedEmail && (await User.exists({ email: normalizedEmail }))) {
    throw new ApiError(409, 'Un compte existe déjà avec cette adresse e-mail');
  }

  // Le compte est actif dès l'inscription : le numéro étant l'identifiant, il
  // n'y a plus de lien e-mail à cliquer pour activer. Pour les artisans, le
  // véritable garde-fou reste la validation du profil par un administrateur,
  // qui conditionne la publication de la fiche.
  const user = await User.create({
    email: normalizedEmail,
    password,
    role,
    firstName,
    lastName,
    phone: normalizedPhone,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  });

  if (role === ROLES.ARTISAN) {
    if (!artisanData || !artisanData.businessName) {
      await User.deleteOne({ _id: user._id });
      throw new ApiError(400, 'Le nom commercial est obligatoire pour les artisans');
    }
    const artisan = await createArtisanProfile(user, artisanData);

    // Notifie les administrateurs : profil en attente de validation
    await notifyAdmins(
      'artisan_validated',
      'Nouvel artisan à valider',
      `${artisan.displayName} a soumis son profil`,
      { artisanId: String(artisan._id), url: '/admin/artisans' }
    );
  } else {
    await Client.create({ userId: user._id });
  }

  // L'e-mail est facultatif : on ne demande sa confirmation que s'il est
  // fourni, puisqu'il constitue alors la seule voie de récupération autonome.
  const verificationToken = normalizedEmail ? await sendVerificationEmail(user) : null;

  logger.info(`Nouvel utilisateur : ${user.phone} (${role})`);
  return { user, verificationToken };
}

/**
 * Crée le profil artisan (statut pending : validation admin obligatoire).
 * artisanId = slug du nom commercial, suffixé si collision.
 */
async function createArtisanProfile(user, artisanData) {
  const base = slugify(artisanData.businessName) || `artisan-${Date.now()}`;
  let artisanId = base;
  let suffix = 1;

  while (await Artisan.exists({ artisanId })) {
    artisanId = `${base}-${suffix}`;
    suffix += 1;
  }

  const artisan = await Artisan.create({
    userId: user._id,
    artisanId,
    displayName: artisanData.businessName.trim(),
    bio: artisanData.bio || '',
    trades: artisanData.trades || [],
    skills: artisanData.skills || [],
    status: 'pending',
    location: {
      department: artisanData.department || '',
      commune: artisanData.commune || '',
      district: artisanData.district || '',
    },
    contactPhone: user.phone,
    // WhatsApp utilise le même numéro par défaut ; modifiable ensuite
    socialLinks: { whatsapp: user.phone },
    contactEmail: user.email || '',
  });

  return artisan;
}

/* ------------------------------------------------------------------ */
/* Connexion / déconnexion                                             */
/* ------------------------------------------------------------------ */

/**
 * Connexion par téléphone (identifiant principal) ou par e-mail, selon ce que
 * l'utilisateur saisit. Le numéro est normalisé avant recherche, sinon la
 * même personne serait introuvable selon la forme tapée.
 */
async function login({ identifier, password, req }) {
  const query = looksLikeEmail(identifier)
    ? { email: String(identifier).trim().toLowerCase() }
    : { phone: normalizePhone(identifier) };

  const user = await User.findOne(query).select('+password');
  if (!user) {
    throw new ApiError(401, 'Identifiant ou mot de passe incorrect');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Identifiant ou mot de passe incorrect');
  }

  if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw new ApiError(403, 'Votre compte est suspendu. Contactez le support.');
  }
  if (user.accountStatus === ACCOUNT_STATUS.DELETED) {
    throw new ApiError(401, 'Identifiant ou mot de passe incorrect');
  }

  const { session, refreshToken } = await createSession(user, req);
  const accessToken = signAccessToken(user);

  user.lastLoginAt = new Date();
  await user.save();

  return { user, accessToken, refreshToken, session };
}

/**
 * Rotation du refresh token.
 * Cas de vol : token JWT valide mais session introuvable/révoquée ->
 * on révoque toutes les sessions de l'utilisateur.
 */
async function refresh(refreshToken, req) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, 'Session invalide ou expirée, reconnectez-vous');
  }

  const tokenHash = hashToken(refreshToken);
  const session = await Session.findOne({ refreshTokenHash: tokenHash });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    // Token valide mais session absente : réutilisation suspecte
    if (payload.sub) {
      await revokeAllSessions(payload.sub, 'token_reuse_detected');
      logger.warn(`Réutilisation suspecte de refresh token (user ${payload.sub})`);
    }
    throw new ApiError(401, 'Session invalide, reconnectez-vous');
  }

  const user = await User.findById(session.user);
  if (!user || user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw new ApiError(403, 'Compte indisponible');
  }

  // Rotation : la nouvelle session remplace l'ancienne
  await Session.updateOne(
    { _id: session._id },
    {
      $set: { revokedAt: new Date(), revokedReason: 'rotated' },
    }
  );

  const newSession = await Session.create({
    user: user._id,
    refreshTokenHash: 'pending',
    ip: req.ip || '',
    userAgent: (req.get('user-agent') || '').slice(0, 500),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    lastUsedAt: new Date(),
  });

  const newRefreshToken = signRefreshToken(user, newSession._id.toString());
  newSession.refreshTokenHash = hashToken(newRefreshToken);
  await newSession.save();

  return {
    user,
    accessToken: signAccessToken(user),
    refreshToken: newRefreshToken,
    session: newSession,
  };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await Session.updateOne(
    { refreshTokenHash: tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: 'logout' } }
  );
}

/* ------------------------------------------------------------------ */
/* Vérification e-mail                                                 */
/* ------------------------------------------------------------------ */

async function verifyEmail(token) {
  const user = await User.findOne({
    emailVerificationToken: hashToken(token),
    emailVerificationExpires: { $gt: new Date() },
  });
  if (!user) {
    throw new ApiError(400, 'Lien de vérification invalide ou expiré');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  // Le compte passe actif après vérification
  if (user.accountStatus === ACCOUNT_STATUS.PENDING) {
    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    await user.save();
  }

  await sendEmail({
    to: user.email,
    subject: 'Bienvenue sur Artisans Marketplace',
    html: welcomeTemplate(user.firstName, user.role),
  });

  return user;
}

/* ------------------------------------------------------------------ */
/* Mot de passe oublié / réinitialisé / changé                         */
/* ------------------------------------------------------------------ */

async function forgotPassword(identifier) {
  const query = looksLikeEmail(identifier)
    ? { email: String(identifier).trim().toLowerCase() }
    : { phone: normalizePhone(identifier) };

  const user = await User.findOne(query);
  // Anti-énumération : réponse identique que le compte existe ou non.
  // Un compte sans e-mail n'a aucune voie de récupération autonome —
  // un administrateur doit réinitialiser le mot de passe à sa place.
  if (!user || !user.email) return;

  const token = generateRandomToken();
  user.passwordResetToken = hashToken(token);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  // Doit correspondre aux routes du site client (client/src/App.jsx)
  const url = `${env.clientUrl}/reinitialiser-mot-de-passe?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe',
    html: resetPasswordTemplate(url, user.firstName),
  });
  return token;
}

async function resetPassword(token, newPassword) {
  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) {
    throw new ApiError(400, 'Lien de réinitialisation invalide ou expiré');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await revokeAllSessions(user._id, 'password_reset');
  return user;
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Le mot de passe actuel est incorrect');
  }

  user.password = newPassword;
  await user.save();

  await revokeAllSessions(userId, 'password_changed');
  return user;
}

/* ------------------------------------------------------------------ */
/* Profil courant                                                      */
/* ------------------------------------------------------------------ */

/**
 * Retourne l'utilisateur + son profil spécialisé (artisan ou client).
 */
async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Utilisateur introuvable');

  const result = { user: user.toPublicJSON() };

  if (user.role === ROLES.ARTISAN) {
    const artisan = await Artisan.findOne({ userId }).populate('trades', 'name slug');
    result.artisan = artisan
      ? {
          id: artisan._id,
          artisanId: artisan.artisanId,
          displayName: artisan.displayName,
          status: artisan.status,
          trades: artisan.trades,
          location: artisan.location,
          rating: artisan.rating,
          isVerified: artisan.isVerified,
        }
      : null;
  } else if (user.role === ROLES.CLIENT) {
    result.client = await Client.findOne({ userId });
  }

  return result;
}

async function findUserByEmail(email) {
  return User.findOne({ email });
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  createSession,
  revokeAllSessions,
  sendVerificationEmail,
  findUserByEmail,
  REFRESH_COOKIE,
  cookieOptions,
  clearCookieOptions,
};
