/**
 * Routes messagerie.
 */
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');
const conversationController = require('../controllers/conversation.controller');
const { REGEX } = require('../constants');

const isObjectId = (value) => {
  if (!REGEX.OBJECT_ID.test(value)) throw new Error('Identifiant invalide');
  return true;
};

router.use(protect);

router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ]),
  conversationController.list
);

router.post(
  '/',
  validate([
    body('artisanId').custom(isObjectId),
    body('quoteId').optional().custom(isObjectId),
  ]),
  conversationController.open
);

router.get('/:id', validate([param('id').custom(isObjectId)]), conversationController.getOne);

router.get(
  '/:id/messages',
  validate([
    param('id').custom(isObjectId),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ]),
  conversationController.listMessages
);

router.post(
  '/:id/messages',
  validate([
    param('id').custom(isObjectId),
    body('content').trim().isLength({ min: 1, max: 4000 }),
  ]),
  conversationController.sendMessage
);

module.exports = router;
