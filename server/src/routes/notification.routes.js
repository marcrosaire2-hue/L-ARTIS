/**
 * Routes notifications (utilisateur authentifié).
 */
const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');

const validate = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');
const { REGEX } = require('../constants');
const notificationController = require('../controllers/notification.controller');

const isObjectId = (value) => REGEX.OBJECT_ID.test(value);

router.get(
  '/me',
  protect,
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('unreadOnly').optional().isIn(['true', 'false']),
  ]),
  notificationController.listMine
);

router.put('/me/read-all', protect, notificationController.markAllRead);

router.put(
  '/:id/read',
  protect,
  validate([param('id').custom(isObjectId).withMessage('Notification invalide')]),
  notificationController.markRead
);

module.exports = router;
