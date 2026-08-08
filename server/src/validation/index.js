/**
 * Validations des routes métier (Express Validator).
 */
const { body, query, param } = require('express-validator');
const { REGEX, QUOTE_STATUS, REVIEW_STATUS, ARTISAN_STATUS, ACCOUNT_STATUS } = require('../constants');
const { isValidPhone } = require('../utils/phone');

/**
 * Un validateur `custom()` d'Express Validator ne signale une erreur que s'il
 * LÈVE (ou renvoie une promesse rejetée) : renvoyer une chaîne d'erreur
 * laisserait passer toutes les valeurs.
 */
const isObjectId = (value) => {
  if (!REGEX.OBJECT_ID.test(value)) throw new Error('Identifiant invalide');
  return true;
};

const isStrongPassword = (value) => {
  if (!REGEX.PASSWORD.test(value)) {
    throw new Error(
      'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'
    );
  }
  return true;
};

const categoryValidation = {
  create: [
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Nom : 2 à 60 caractères'),
    body('description').optional().isLength({ max: 300 }),
    body('icon').optional().isString().isLength({ max: 20 }),
    body('image').optional().isURL().withMessage('Image invalide'),
    body('sortOrder').optional().isInt({ min: 0 }),
  ],
  update: [
    param('id').custom(isObjectId),
    body('name').optional().isLength({ min: 2, max: 60 }),
    body('isActive').optional().isBoolean(),
    body('sortOrder').optional().isInt({ min: 0 }),
  ],
  id: [param('id').custom(isObjectId)],
  tradeCreate: [
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Nom : 2 à 60 caractères'),
    body('categoryId').custom(isObjectId).withMessage('Catégorie requise'),
    body('description').optional().isLength({ max: 300 }),
    body('icon').optional().isString().isLength({ max: 20 }),
    body('image').optional().isURL().withMessage('Image invalide'),
  ],
  tradeUpdate: [
    param('id').custom(isObjectId),
    body('name').optional().isLength({ min: 2, max: 60 }),
    body('category').optional().custom(isObjectId),
    body('isActive').optional().isBoolean(),
    body('icon').optional().isString().isLength({ max: 20 }),
    body('image').optional().isURL().withMessage('Image invalide'),
  ],
};

const artisanValidation = {
  search: [
    query('q').optional().isString().isLength({ max: 100 }),
    query('trade').optional().isString().isLength({ max: 500 }),
    query('category').optional().custom(isObjectId),
    query('department').optional().isString().isLength({ max: 60 }),
    query('commune').optional().isString().isLength({ max: 60 }),
    query('district').optional().isString().isLength({ max: 60 }),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('lat').optional().isFloat({ min: -90, max: 90 }),
    query('lng').optional().isFloat({ min: -180, max: 180 }),
    query('distance').optional().isFloat({ min: 1, max: 500 }),
    query('sort').optional().isIn(['rating', 'price', 'newest', 'distance']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  profile: [
    body('displayName').optional().isLength({ min: 2, max: 80 }),
    body('tagline').optional().isLength({ max: 120 }),
    body('bio').optional().isLength({ max: 2000 }),
    body('profilePhoto').optional().isString().isLength({ max: 500 }),
    body('logo').optional().isString().isLength({ max: 500 }),
    body('coverPhoto').optional().isString().isLength({ max: 500 }),
    body('trades').optional().isArray({ max: 20 }).custom((arr) => arr.every(isObjectId)),
    body('skills').optional().isArray({ max: 50 }).custom((arr) => arr.every((s) => typeof s === 'string' && s.length <= 40)),
    body('yearsExperience').optional().isInt({ min: 0, max: 80 }),
    body('pricing.fromPrice').optional().isFloat({ min: 0 }),
    body('pricing.currency').optional().isString().isLength({ max: 5 }),
    body('pricing.unit').optional().isIn(['heure', 'jour', 'forfait', 'projet']),
    body('location.department').optional().isString().isLength({ max: 60 }),
    body('location.commune').optional().isString().isLength({ max: 60 }),
    body('location.district').optional().isString().isLength({ max: 60 }),
    body('location.address').optional().isLength({ max: 200 }),
    body('location.coordinates').optional().isObject(),
    body('availability.isAvailable').optional().isBoolean(),
    body('availability.note').optional().isLength({ max: 200 }),
    body('socialLinks.facebook').optional().isLength({ max: 300 }),
    body('socialLinks.instagram').optional().isLength({ max: 300 }),
    body('socialLinks.whatsapp').optional().isLength({ max: 300 }),
    body('socialLinks.website').optional().isLength({ max: 300 }),
    body('contactPhone').optional({ values: 'falsy' }).custom((value) => {
      if (!isValidPhone(value)) throw new Error('Numéro de contact invalide');
      return true;
    }),
    body('contactEmail').optional({ values: 'falsy' }).isEmail().withMessage('E-mail de contact invalide'),
  ],
  // Réalisation : le prix est facultatif — « sur devis » est une réponse
  // légitime pour beaucoup de métiers, l'exiger poussait à saisir un chiffre
  // faux que le client prenait ensuite pour un engagement.
  serviceCreate: [
    body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Titre : 3 à 100 caractères'),
    body('description').optional().isLength({ max: 2000 }),
    body('price').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('Prix invalide'),
    body('priceUnit').optional().isIn(['heure', 'jour', 'forfait', 'projet']),
    body('durationMin').optional({ values: 'null' }).isInt({ min: 5 }),
    body('trade').optional().custom(isObjectId),
    body('media').optional().isArray({ max: 10 }).withMessage('Maximum 10 photos'),
    body('media.*').custom(isObjectId).withMessage('Photo invalide'),
  ],
  serviceId: [param('id').custom(isObjectId)],
  serviceUpdate: [
    param('id').custom(isObjectId),
    body('title').optional().isLength({ min: 3, max: 100 }),
    body('description').optional().isLength({ max: 2000 }),
    body('price').optional({ values: 'null' }).isFloat({ min: 0 }),
    body('priceUnit').optional().isIn(['heure', 'jour', 'forfait', 'projet']),
    body('durationMin').optional({ values: 'null' }).isInt({ min: 5 }),
    body('media').optional().isArray({ max: 10 }),
    body('media.*').custom(isObjectId),
    body('isActive').optional().isBoolean(),
  ],
  artisanId: [param('artisanId').isString().matches(/^[a-z0-9-]{2,100}$/).withMessage('Identifiant d\'artisan invalide')],
};

const quoteValidation = {
  create: [
    body('artisanId').custom(isObjectId).withMessage('Artisan requis'),
    body('serviceId').optional().custom(isObjectId),
    body('title').trim().isLength({ min: 3, max: 120 }).withMessage('Titre requis'),
    body('description').trim().isLength({ min: 10, max: 3000 }).withMessage('Décrivez votre besoin (10 caractères min)'),
    body('budget.min').optional().isFloat({ min: 0 }),
    body('budget.max').optional().isFloat({ min: 0 }),
    body('preferredDate').optional().isISO8601(),
    body('location.commune').optional().isLength({ max: 60 }),
    body('location.district').optional().isLength({ max: 60 }),
    body('location.address').optional().isLength({ max: 200 }),
  ],
  id: [param('id').custom(isObjectId)],
  list: [
    query('status').optional().isIn(Object.values(QUOTE_STATUS)),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  respond: [
    param('id').custom(isObjectId),
    body('status').isIn([QUOTE_STATUS.ACCEPTED, QUOTE_STATUS.REJECTED]).withMessage('accepted | rejected'),
    body('price').optional().isFloat({ min: 0 }),
    body('durationDays').optional().isInt({ min: 1, max: 365 }),
    body('message').optional().isLength({ max: 2000 }),
  ],
  updateStatus: [
    param('id').custom(isObjectId),
    body('status').isIn([QUOTE_STATUS.COMPLETED, QUOTE_STATUS.REJECTED]).withMessage('completed | rejected'),
    body('clientNotes').optional().isLength({ max: 1000 }),
    body('cancelReason').optional().isLength({ max: 300 }),
  ],
};

const reviewValidation = {
  create: [
    body('artisanId').optional().custom(isObjectId),
    body('quoteId').optional().custom(isObjectId),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Note entre 1 et 5'),
    body('comment').trim().isLength({ min: 3, max: 2000 }).withMessage('Commentaire requis'),
  ],
  reply: [
    param('id').custom(isObjectId),
    body('text').trim().isLength({ min: 2, max: 1000 }).withMessage('Réponse requise'),
  ],
  id: [param('id').custom(isObjectId)],
};

const favoriteValidation = {
  create: [body('artisanId').custom(isObjectId).withMessage('Artisan requis')],
  id: [param('artisanId').custom(isObjectId).withMessage('Artisan invalide')],
};

const adminValidation = {
  artisanStatus: [
    param('id').custom(isObjectId),
    body('status').isIn(Object.values(ARTISAN_STATUS)).withMessage('Statut invalide'),
    body('reason').optional().isLength({ max: 500 }),
  ],
  userStatus: [
    param('id').custom(isObjectId),
    body('status').isIn(Object.values(ACCOUNT_STATUS)).withMessage('Statut invalide'),
    body('reason').optional().isLength({ max: 500 }),
  ],
  reviewStatus: [
    param('id').custom(isObjectId),
    body('status').isIn([REVIEW_STATUS.APPROVED, REVIEW_STATUS.HIDDEN]).withMessage('approved | hidden'),
  ],
  list: [
    query('status').optional().isString().isLength({ max: 30 }),
    query('role').optional().isIn(['client', 'artisan', 'admin']),
    query('q').optional().isString().isLength({ max: 100 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  createAdmin: [
    body('email').trim().isEmail().withMessage('Adresse e-mail invalide'),
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
    body('roleAdmin')
      .optional()
      .isIn(['super', 'manager', 'moderator'])
      .withMessage('Niveau admin invalide (super | manager | moderator)'),
  ],
  listActivities: [
    query('actor').optional().custom(isObjectId),
    query('action').optional().isString().isLength({ max: 80 }),
    query('targetType')
      .optional()
      .isIn(['artisan', 'user', 'review', 'admin', 'category', 'trade', 'system']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
};

module.exports = { categoryValidation, artisanValidation, quoteValidation, reviewValidation, favoriteValidation, adminValidation };
