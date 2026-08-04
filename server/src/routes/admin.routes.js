/**
 * Routes administration (protégées : admin actif).
 */
const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate.middleware');
const { protect, authorize, requireAdmin, requirePermission } = require('../middlewares/auth.middleware');
const { adminValidation, categoryValidation } = require('../validation');
const adminController = require('../controllers/admin.controller');
const reportController = require('../controllers/report.controller');
const { body, param, query } = require('express-validator');
const { REPORT_STATUS, REGEX } = require('../constants');

router.use(protect, authorize('admin'), requireAdmin);

// --- Artisans : validation / suspension ---
router.get(
  '/artisans',
  requirePermission('artisans'),
  validate(adminValidation.list),
  adminController.listArtisans
);
router.put(
  '/artisans/:id/status',
  requirePermission('artisans'),
  validate(adminValidation.artisanStatus),
  adminController.setArtisanStatus
);

// --- Utilisateurs ---
router.get(
  '/users',
  requirePermission('users'),
  validate(adminValidation.list),
  adminController.listUsers
);
router.put(
  '/users/:id/status',
  requirePermission('users'),
  validate(adminValidation.userStatus),
  adminController.setUserStatus
);
router.delete(
  '/users/:id',
  requirePermission('users'),
  validate(categoryValidation.id),
  adminController.deleteUser
);
router.put(
  '/users/:id/password',
  requirePermission('users'),
  validate(categoryValidation.id),
  adminController.resetUserPassword
);

// --- Avis : modération ---
router.get(
  '/reviews',
  requirePermission('reviews'),
  validate(adminValidation.list),
  adminController.listReviews
);
router.put(
  '/reviews/:id/status',
  requirePermission('reviews'),
  validate(adminValidation.reviewStatus),
  adminController.setReviewStatus
);

// --- Signalements ---
router.get(
  '/reports',
  requirePermission('reports'),
  validate([
    query('status').optional().isIn(Object.values(REPORT_STATUS)),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ]),
  reportController.list
);
router.put(
  '/reports/:id',
  requirePermission('reports'),
  validate([
    param('id').custom((value) => {
      if (!REGEX.OBJECT_ID.test(value)) throw new Error('Identifiant invalide');
      return true;
    }),
    body('status').isIn([REPORT_STATUS.REVIEWED, REPORT_STATUS.DISMISSED]),
    body('resolutionNote').optional().isLength({ max: 1000 }),
  ]),
  reportController.handle
);

// --- Administrateurs ---
router.get('/me', adminController.getAdminMe);
router.get('/admins', requirePermission('settings'), adminController.listAdmins);
router.post(
  '/admins',
  requirePermission('settings'),
  validate(adminValidation.createAdmin),
  adminController.createAdmin
);

// --- Traçabilité des effets admin ---
router.get('/activities', validate(adminValidation.listActivities), adminController.listActivities);

module.exports = router;
