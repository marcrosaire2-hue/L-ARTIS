/**
 * Contrôleur d'authentification.
 * Gère les cookies httpOnly du refresh token et le format de réponse.
 */
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const authService = require('../services/auth.service');
const accountService = require('../services/account.service');
const env = require('../config/env');

/**
 * Une application native n'a pas de cookie : le refresh token doit lui être
 * remis dans le corps de la réponse, pour être rangé dans le trousseau
 * sécurisé du téléphone (Keychain / Keystore).
 *
 * Strictement réservé au client mobile : le renvoyer à un navigateur
 * annulerait la protection du cookie httpOnly, qu'une injection XSS ne peut
 * pas lire alors qu'elle lirait sans peine une valeur passée par le corps.
 */
const isNativeClient = (req) => req.get('x-client-type') === 'mobile';

/* ------------------------------------------------------------------ */
/* Inscription                                                         */
/* ------------------------------------------------------------------ */

const register = catchAsync(async (req, res) => {
  const { user, verificationCode } = await authService.register(req.body);

  const data = { user: user.toPublicJSON() };
  if (!env.isProduction) data.dev = { verificationCode };

  res.status(201).json(
    ApiResponse.created(
      'Inscription réussie. Un code de vérification a été envoyé par e-mail.',
      data
    )
  );
});

/* ------------------------------------------------------------------ */
/* Connexion                                                           */
/* ------------------------------------------------------------------ */

const login = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login({
    identifier: req.body.identifier,
    password: req.body.password,
    req,
  });

  const native = isNativeClient(req);
  if (!native) {
    res.cookie(authService.REFRESH_COOKIE, refreshToken, authService.cookieOptions());
  }

  res.json(
    ApiResponse.ok('Connexion réussie', {
      user: user.toPublicJSON(),
      accessToken,
      ...(native && { refreshToken }),
    })
  );
});

const logout = catchAsync(async (req, res) => {
  const token = req.cookies[authService.REFRESH_COOKIE] || req.body.refreshToken;
  await authService.logout(token);

  res.clearCookie(
    authService.REFRESH_COOKIE,
    authService.clearCookieOptions()
  );
  res.json(ApiResponse.ok('Déconnexion réussie'));
});

/* ------------------------------------------------------------------ */
/* Rafraîchissement du token                                           */
/* ------------------------------------------------------------------ */

const refresh = catchAsync(async (req, res) => {
  const incomingToken =
    req.cookies[authService.REFRESH_COOKIE] || req.body.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, 'Session absente, reconnectez-vous');
  }

  const { user, accessToken, refreshToken } = await authService.refresh(
    incomingToken,
    req
  );

  const native = isNativeClient(req);
  if (!native) {
    res.cookie(authService.REFRESH_COOKIE, refreshToken, authService.cookieOptions());
  }

  res.json(
    ApiResponse.ok('Token rafraîchi', {
      user: user.toPublicJSON(),
      accessToken,
      ...(native && { refreshToken }),
    })
  );
});

/* ------------------------------------------------------------------ */
/* Vérification d'e-mail                                               */
/* ------------------------------------------------------------------ */

const verifyEmail = catchAsync(async (req, res) => {
  const user = await authService.verifyEmail({
    code: req.body.code,
    email: req.body.email,
  });
  res.json(
    ApiResponse.ok('Adresse e-mail vérifiée.', {
      user: user.toPublicJSON(),
    })
  );
});

const resendVerification = catchAsync(async (req, res) => {
  const code = await authService.resendVerificationEmail(req.body.email);

  const data = {};
  if (!env.isProduction) data.dev = { verificationCode: code || null };

  res.json(
    ApiResponse.ok(
      'Si un compte non vérifié existe pour cette adresse, un nouveau code vient d’être envoyé.',
      data
    )
  );
});

/* ------------------------------------------------------------------ */
/* Mot de passe                                                        */
/* ------------------------------------------------------------------ */

const forgotPassword = catchAsync(async (req, res) => {
  const token = await authService.forgotPassword(req.body.identifier);

  const data = {};
  if (!env.isProduction) data.dev = { resetToken: token || null };

  res.json(
    ApiResponse.ok(
      'Si un compte existe et dispose d’une adresse e-mail, un lien de réinitialisation vient d’être envoyé.',
      data
    )
  );
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  res.json(ApiResponse.ok('Mot de passe réinitialisé. Vous pouvez vous connecter.'));
});

const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user._id, {
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });
  res.json(
    ApiResponse.ok('Mot de passe modifié. Toutes les sessions ont été fermées.')
  );
});

/* ------------------------------------------------------------------ */
/* Profil courant                                                      */
/* ------------------------------------------------------------------ */

/**
 * Suppression du compte par son titulaire. Le cookie de session est effacé
 * dans la foulée : le compte n'existe plus, la session non plus.
 */
const deleteMe = catchAsync(async (req, res) => {
  await accountService.deleteMyAccount(req.user._id, req.body.password);
  res.clearCookie(authService.REFRESH_COOKIE, authService.clearCookieOptions());
  res.json(ApiResponse.ok('Votre compte a été supprimé définitivement.'));
});

const getMe = catchAsync(async (req, res) => {
  const data = await authService.getMe(req.user._id);
  res.json(ApiResponse.ok('Profil récupéré', data));
});

const acceptTerms = catchAsync(async (req, res) => {
  const user = await authService.acceptTerms(req.user._id);
  res.json(ApiResponse.ok('Règlement accepté.', { user: user.toPublicJSON() }));
});

module.exports = {
  register,
  login,
  logout,
  refresh,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  deleteMe,
  acceptTerms,
};
