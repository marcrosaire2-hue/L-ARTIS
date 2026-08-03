/**
 * Routes géographie — lecture seule et publique (nécessaire dès le
 * formulaire d'inscription, donc avant toute authentification).
 */
const express = require('express');
const router = express.Router();

const { query } = require('express-validator');
const validate = require('../middlewares/validate.middleware');
const locationController = require('../controllers/location.controller');

router.get('/', locationController.listDepartments);

router.get(
  '/districts',
  validate([query('commune').trim().notEmpty().withMessage('Commune requise').isLength({ max: 100 })]),
  locationController.listDistricts
);

module.exports = router;
