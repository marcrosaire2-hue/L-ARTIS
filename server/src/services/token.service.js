/**
 * Service de jetons : JWT (access + refresh), hachage et tokens aléatoires.
 *
 * Stratégie de sécurité :
 *  - Access token : court (15 min), transmis en header Authorization.
 *  - Refresh token : long (7 j), transmis en cookie httpOnly, haché (sha256)
 *    et stocké dans la collection Session (rotation à chaque usage).
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

/**
 * Access token : { sub: userId, role }.
 */
function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.accessExpiresIn, issuer: env.jwt.issuer }
  );
}

/**
 * Refresh token : { sub: userId, sid: sessionId }.
 */
function signRefreshToken(user, sessionId) {
  return jwt.sign(
    { sub: user._id.toString(), sid: sessionId },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn, issuer: env.jwt.issuer }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret, { issuer: env.jwt.issuer });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret, { issuer: env.jwt.issuer });
}

/**
 * Hachage du refresh token AVANT stockage en base :
 * un vol de la base de données ne permet pas de réutiliser les tokens.
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Token aléatoire (vérification d'e-mail, reset de mot de passe).
 * 32 octets -> 64 caractères hexadécimaux.
 */
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
};
