/**
 * Routes catégories & métiers.
 * Public : consultation. Admin : gestion complète (CRUD).
 */
const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate.middleware');
const { protect, authorize, requireAdmin } = require('../middlewares/auth.middleware');
const { categoryValidation } = require('../validation');
const categoryController = require('../controllers/category.controller');

// --- Public ---
router.get('/', categoryController.listCategories);
router.get('/trades', categoryController.listTrades);
router.get('/:slug', categoryController.getCategoryBySlug);

// --- Administration ---
router.post('/', protect, authorize('admin'), requireAdmin, validate(categoryValidation.create), categoryController.createCategory);
router.put('/:id', protect, authorize('admin'), requireAdmin, validate(categoryValidation.update), categoryController.updateCategory);
router.delete('/:id', protect, authorize('admin'), requireAdmin, validate(categoryValidation.id), categoryController.deleteCategory);

router.post('/trades/create', protect, authorize('admin'), requireAdmin, validate(categoryValidation.tradeCreate), categoryController.createTrade);
router.put('/trades/:id', protect, authorize('admin'), requireAdmin, validate(categoryValidation.tradeUpdate), categoryController.updateTrade);
router.delete('/trades/:id', protect, authorize('admin'), requireAdmin, validate(categoryValidation.id), categoryController.deleteTrade);

module.exports = router;
