/**
 * Routes uploads (utilisateur connecté).
 * POST /uploads : envoi multipart (champ "file").
 * DELETE /uploads/:id : suppression (propriétaire).
 */
const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { upload, enforceSizeByType } = require('../middlewares/upload.middleware');
const uploadController = require('../controllers/upload.controller');

router.post('/', protect, upload.single('file'), enforceSizeByType, uploadController.uploadMedia);
router.delete('/:id', protect, uploadController.deleteMedia);

module.exports = router;
