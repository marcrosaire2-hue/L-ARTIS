/**
 * Routes signalements (création par utilisateurs authentifiés).
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');
const reportController = require('../controllers/report.controller');
const { REGEX } = require('../constants');

router.post(
  '/',
  protect,
  validate([
    body('targetType').isIn(['artisan', 'review', 'quote', 'message']),
    body('targetId').custom((value) => {
      if (!REGEX.OBJECT_ID.test(value)) throw new Error('Identifiant invalide');
      return true;
    }),
    body('reason').isIn([
      'profil_frauduleux',
      'fausses_informations',
      'comportement_inapproprie',
      'arnaque',
      'spam',
      'contenu_illicite',
      'autre',
    ]),
    body('description').optional().isLength({ max: 2000 }),
  ]),
  reportController.create
);

module.exports = router;
