/**
 * Routes d'authentification.
 * L'endpoint /refresh lit le refresh token depuis le cookie httpOnly
 * (fallback : body.refreshToken pour les clients non-navigateur).
 */
const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const authValidation = require('../validation/auth.validation');
const authController = require('../controllers/auth.controller');

router.post('/register', authLimiter, validate(authValidation.register), authController.register);
router.post('/login', authLimiter, validate(authValidation.login), authController.login);
// Pas de `protect` : le cookie de refresh EST l'élément à révoquer, et c'est
// la seule preuve nécessaire. L'exiger en plus d'un access token valide rendait
// la déconnexion impossible dès que celui-ci expirait (15 min), laissant le
// cookie actif 7 jours — l'utilisateur se croyait déconnecté et se retrouvait
// reconnecté au rechargement suivant.
router.post('/logout', authController.logout);
router.post('/refresh', authLimiter, validate(authValidation.refresh), authController.refresh);
router.post('/verify-email', authLimiter, validate(authValidation.verifyEmail), authController.verifyEmail);
router.post('/forgot-password', authLimiter, validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(authValidation.resetPassword), authController.resetPassword);
router.post('/change-password', protect, validate(authValidation.changePassword), authController.changePassword);
router.get('/me', protect, authController.getMe);
// Suppression définitive par le titulaire, confirmée par son mot de passe
router.delete('/me', protect, validate(authValidation.deleteAccount), authController.deleteMe);

module.exports = router;
