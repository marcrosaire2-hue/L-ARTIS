/**
 * Règles de validation des routes d'authentification.
 * Chaque règle est un tableau Express Validator (DRY via validate()).
 */
const { body } = require('express-validator');
const { REGEX, ROLES } = require('../constants');
const { isValidPhone } = require('../utils/phone');

const isStrongPassword = (value) =>
  REGEX.PASSWORD.test(value) ||
  'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre';

const authValidation = {
  register: [
    // Le téléphone est l'identifiant de connexion : obligatoire et validé
    // après normalisation E.164 (voir utils/phone.js).
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Le numéro de téléphone est obligatoire')
      .bail()
      .custom((value) => {
        if (!isValidPhone(value)) throw new Error('Numéro de téléphone invalide');
        return true;
      }),
    // E-mail obligatoire : vérification du compte + récupération de mot de passe.
    body('email')
      .trim()
      .notEmpty()
      .withMessage("L'adresse e-mail est obligatoire")
      .bail()
      .isEmail()
      .withMessage('Adresse e-mail invalide'),
    body('password')
      .isString()
      .isLength({ min: 8, max: 72 })
      .withMessage('Le mot de passe doit contenir entre 8 et 72 caractères')
      .custom(isStrongPassword),
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
    body('role')
      .isIn([ROLES.CLIENT, ROLES.ARTISAN])
      .withMessage('Rôle invalide : client ou artisan'),
    body('artisanData')
      .optional()
      .isObject()
      .withMessage('artisanData doit être un objet'),
    body('artisanData.businessName')
      .if(body('role').equals(ROLES.ARTISAN))
      .notEmpty()
      .withMessage('Le nom commercial est obligatoire')
      .isLength({ min: 2, max: 80 })
      .withMessage('Nom commercial : 2 à 80 caractères'),
    body('artisanData.bio')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Bio : 2000 caractères maximum'),
    body('artisanData.department')
      .optional()
      .isString()
      .isLength({ max: 60 }),
    body('artisanData.commune')
      .optional()
      .isString()
      .isLength({ max: 60 }),
    body('artisanData.district')
      .optional()
      .isString()
      .isLength({ max: 60 }),
    // Au moins un métier : sans lui, la fiche n'apparaît dans aucune
    // recherche — l'artisan serait inscrit mais introuvable.
    body('artisanData.trades')
      .if(body('role').equals(ROLES.ARTISAN))
      .isArray({ min: 1, max: 20 })
      .withMessage('Choisissez entre 1 et 20 métiers')
      .custom((trades) => trades.every((t) => REGEX.OBJECT_ID.test(t)))
      .withMessage('Identifiants de métiers invalides'),
    body('artisanData.skills')
      .optional()
      .isArray({ max: 20 })
      .withMessage('Maximum 20 compétences'),
  ],

  login: [
    // Téléphone ou e-mail : la distinction se fait côté service.
    body('identifier')
      .trim()
      .notEmpty()
      .withMessage('Numéro de téléphone ou adresse e-mail requis'),
    body('password')
      .isString()
      .notEmpty()
      .withMessage('Le mot de passe est obligatoire'),
  ],

  refresh: [
    body('refreshToken')
      .optional()
      .isString()
      .notEmpty()
      .withMessage('Refresh token invalide'),
  ],

  verifyEmail: [
    body('code')
      .trim()
      .matches(/^\d{6}$/)
      .withMessage('Le code doit contenir 6 chiffres'),
    body('email')
      .optional({ values: 'falsy' })
      .trim()
      .isEmail()
      .withMessage('Adresse e-mail invalide'),
  ],

  resendVerification: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage("L'adresse e-mail est obligatoire")
      .bail()
      .isEmail()
      .withMessage('Adresse e-mail invalide'),
  ],

  forgotPassword: [
    body('identifier')
      .trim()
      .notEmpty()
      .withMessage('Numéro de téléphone ou adresse e-mail requis'),
  ],

  resetPassword: [
    body('token')
      .isString()
      .isLength({ min: 10, max: 200 })
      .withMessage('Token invalide'),
    body('newPassword')
      .isString()
      .isLength({ min: 8, max: 72 })
      .withMessage('Le mot de passe doit contenir entre 8 et 72 caractères')
      .custom(isStrongPassword),
  ],

  deleteAccount: [
    // Ré-authentification obligatoire : l'action est irréversible.
    body('password').isString().notEmpty().withMessage('Mot de passe requis'),
  ],

  changePassword: [
    body('currentPassword')
      .isString()
      .notEmpty()
      .withMessage('Le mot de passe actuel est obligatoire'),
    body('newPassword')
      .isString()
      .isLength({ min: 8, max: 72 })
      .withMessage('Le mot de passe doit contenir entre 8 et 72 caractères')
      .custom(isStrongPassword)
      .custom((value, { req }) => value !== req.body.currentPassword)
      .withMessage('Le nouveau mot de passe doit être différent de l’actuel'),
  ],
};

module.exports = authValidation;
