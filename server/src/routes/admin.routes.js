/**
 * Routes administration (protégées : admin actif).
 */
const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate.middleware');
const { protect, authorize, requireAdmin } = require('../middlewares/auth.middleware');
const { adminValidation, categoryValidation } = require('../validation');
const adminController = require('../controllers/admin.controller');

router.use(protect, authorize('admin'), requireAdmin);

// --- Artisans : validation / suspension ---
router.get('/artisans', validate(adminValidation.list), adminController.listArtisans);
router.put('/artisans/:id/status', validate(adminValidation.artisanStatus), adminController.setArtisanStatus);

// --- Utilisateurs ---
router.get('/users', validate(adminValidation.list), adminController.listUsers);
router.put('/users/:id/status', validate(adminValidation.userStatus), adminController.setUserStatus);
router.delete('/users/:id', validate(categoryValidation.id), adminController.deleteUser);
// Seule voie de récupération pour un compte sans e-mail
router.put('/users/:id/password', validate(categoryValidation.id), adminController.resetUserPassword);

// --- Avis : modération ---
router.get('/reviews', validate(adminValidation.list), adminController.listReviews);
router.put('/reviews/:id/status', validate(adminValidation.reviewStatus), adminController.setReviewStatus);

// --- Administrateurs ---
router.get('/me', adminController.getAdminMe);
router.get('/admins', adminController.listAdmins);
router.post('/admins', validate(adminValidation.createAdmin), adminController.createAdmin);

// --- Traçabilité des effets admin ---
router.get('/activities', validate(adminValidation.listActivities), adminController.listActivities);

module.exports = router;
