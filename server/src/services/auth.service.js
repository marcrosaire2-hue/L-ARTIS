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
  generateVerificationCode,
} = require('./token.service');
const { sendEmail } = require('./email.service');
const { notifyAdmins } = require('./notification.service');
const {
  verifyEmailTemplate,
  resetPasswordTemplate,
  welcomeTemplate,
} = require('../helpers/email/templates');
const { ROLES, ACCOUNT_STATUS, TERMS_VERSION } = require('../constants');
const { normalizePhone, looksLikeEmail } = require('../utils/phone');

const REFRESH_COOKIE = 'refresh_token';
const MAX_ACTIVE_SESSIONS = 10;

/* ------------------------------------------------------------------ */
/* Helpers internes                                                    */
/* ------------------------------------------------------------------ */

function cookieOptions() {
  // En production (Render), client/admin et API sont sur des domaines
  // distincts : SameSite=Lax bloquerait le cookie de refresh en XHR
  // cross-site. None + Secure est requis pour que credentials: 'include'
  // fonctionne entre *.onrender.com.
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  };
}

function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
  };
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
 * Envoie un code OTP à 6 chiffres par e-mail + retourne le code (champ dev).
 */
async function sendVerificationEmail(user) {
  const code = generateVerificationCode();
  user.emailVerificationToken = hashToken(code);
  user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  await sendEmail({
    to: user.email,
    subject: `${code} — votre code de vérification L-ARTIS`,
    html: verifyEmailTemplate(code, user.firstName),
  });
  return code;
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

  const normalizedEmail = email ? String(email).trim().toLowerCase() : '';
  if (!normalizedEmail) {
    throw new ApiError(400, "L'adresse e-mail est obligatoire");
  }

  // Les deux vérifications partent ensemble : enchaînées, elles coûtaient
  // deux allers-retours à la base, sur une liaison qui n'est pas rapide.
  const [phoneTaken, emailTaken] = await Promise.all([
    User.exists({ phone: normalizedPhone }),
    User.exists({ email: normalizedEmail }),
  ]);
  if (phoneTaken) {
    throw new ApiError(409, 'Un compte existe déjà avec ce numéro de téléphone');
  }
  if (emailTaken) {
    throw new ApiError(409, 'Un compte existe déjà avec cette adresse e-mail');
  }

  // Le compte est actif dès l'inscription (identifiant = téléphone). L'e-mail
  // sert à la récupération de mot de passe et doit être confirmé. Pour les
  // artisans, la publication de la fiche reste soumise à validation admin.
  const user = await User.create({
    email: normalizedEmail,
    password,
    role,
    firstName,
    lastName,
    phone: normalizedPhone,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  });

  // Le compte et son profil vont de pair : un utilisateur artisan sans fiche
  // n'a pas d'espace de travail, et le numéro resterait pris — l'artisan ne
  // pourrait même pas se réinscrire. En cas d'échec, on défait la création.
  try {
    if (role === ROLES.ARTISAN) {
      if (!artisanData || !artisanData.businessName) {
        throw new ApiError(400, 'Le nom commercial est obligatoire pour les artisans');
      }
      const artisan = await createArtisanProfile(user, artisanData);

      // Notifie les administrateurs : profil en attente de validation.
      // Accessoire au regard de l'inscription : son échec ne doit pas la faire
      // échouer, le profil reste visible dans la file d'attente admin.
      await notifyAdmins(
        'artisan_validated',
        'Nouvel artisan à valider',
        `${artisan.displayName} a soumis son profil`,
        { artisanId: String(artisan._id), url: '/admin/artisans' }
      ).catch((error) => {
        logger.error(`Notification admin impossible (artisan ${artisan._id}) : ${error.message}`);
      });
    } else {
      await Client.create({ userId: user._id });
    }
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }

  // L'envoi du code ne conditionne pas la création du compte : un SMTP
  // indisponible ferait échouer l'inscription APRÈS création, et la reprise
  // buterait ensuite sur « ce numéro existe déjà ». Le code est renvoyable
  // depuis l'écran de vérification (/auth/resend-verification).
  let verificationCode = null;
  if (env.emailVerification) {
    try {
      verificationCode = await sendVerificationEmail(user);
    } catch (error) {
      logger.error(`Code de vérification non envoyé à ${user.email} : ${error.message}`);
    }
  }

  logger.info(`Nouvel utilisateur : ${user.phone} (${role})`);
  return { user, verificationCode };
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

/**
 * Ouvre une session pour un utilisateur déjà identifié.
 *
 * Utilisé juste après l'inscription : refaire une connexion complète
 * imposait un second aller-retour et une comparaison bcrypt inutile, alors
 * qu'on vient de créer le compte et qu'on sait déjà qui il est. Sur une
 * liaison lente, ce second appel doublait l'attente devant un bouton figé.
 */
async function issueSession(user, req) {
  const { refreshToken } = await createSession(user, req);
  user.lastLoginAt = new Date();
  await user.save();
  return { accessToken: signAccessToken(user), refreshToken };
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

/**
 * Vérifie le code reçu par e-mail.
 * `email` (recommandé) restreint la recherche et limite le brute-force.
 */
async function verifyEmail({ code, email }) {
  if (!env.emailVerification) {
    throw new ApiError(503, "La vérification par e-mail est temporairement désactivée.");
  }

  const normalizedCode = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalizedCode)) {
    throw new ApiError(400, 'Le code doit contenir 6 chiffres');
  }

  const filters = {
    emailVerificationToken: hashToken(normalizedCode),
    emailVerificationExpires: { $gt: new Date() },
  };
  if (email) {
    filters.email = String(email).trim().toLowerCase();
  }

  const user = await User.findOne(filters).select('+emailVerificationToken +emailVerificationExpires');
  if (!user) {
    throw new ApiError(400, 'Code invalide ou expiré');
  }

  if (user.isEmailVerified) {
    return user;
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  if (user.accountStatus === ACCOUNT_STATUS.PENDING) {
    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
  }
  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'Bienvenue sur L-ARTIS',
    html: welcomeTemplate(user.firstName, user.role),
  });

  return user;
}

/**
 * Renvoie un nouveau code de vérification.
 * Anti-énumération : réponse OK même si le compte n'existe pas.
 */
async function resendVerificationEmail(email) {
  if (!env.emailVerification) {
    throw new ApiError(503, "La vérification par e-mail est temporairement désactivée.");
  }

  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) {
    throw new ApiError(400, "L'adresse e-mail est obligatoire");
  }

  const user = await User.findOne({ email: normalized }).select(
    '+emailVerificationToken +emailVerificationExpires'
  );
  if (!user || user.isEmailVerified) return null;

  return sendVerificationEmail(user);
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

  const webUrl = `${env.clientUrl}/reinitialiser-mot-de-passe?token=${token}`;
  const appUrl = `${env.appDeepLinkBase}reinitialiser-mot-de-passe?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe',
    html: resetPasswordTemplate(webUrl, user.firstName, appUrl),
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

/**
 * Enregistre l'acceptation du règlement (clients ou artisans) après lecture.
 * Obligatoire avant de poursuivre le parcours post-inscription.
 */
async function acceptTerms(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Utilisateur introuvable');
  if (user.role === ROLES.ADMIN) {
    throw new ApiError(400, 'Non applicable aux administrateurs');
  }

  user.termsAcceptedAt = new Date();
  user.termsVersion = TERMS_VERSION;
  await user.save();

  logger.info(`Règlement accepté : ${user.phone || user.email} (v${TERMS_VERSION})`);
  return user;
}

module.exports = {
  register,
  issueSession,
  login,
  refresh,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  acceptTerms,
  createSession,
  revokeAllSessions,
  sendVerificationEmail,
  findUserByEmail,
  REFRESH_COOKIE,
  cookieOptions,
  clearCookieOptions,
};
