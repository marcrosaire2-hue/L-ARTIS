/**
 * Middleware Multer — uploads d'images et vidéos vers Cloudinary.
 * - Stockage en MÉMOIRE (le fichier est transmis à Cloudinary ensuite).
 * - MIME vérifié par fileFilter + contrôle de taille par type.
 */
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { MIME_TYPES } = require('../constants');

const ALLOWED = [...MIME_TYPES.IMAGE, ...MIME_TYPES.VIDEO];
const IMAGE_MAX = 5 * 1024 * 1024; // 5 Mo
const VIDEO_MAX = 100 * 1024 * 1024; // 100 Mo

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED.includes(file.mimetype)) return cb(null, true);
  cb(new ApiError(400, 'Format de fichier non autorisé (JPEG, PNG, WebP, GIF, MP4, WebM, OGG)'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: VIDEO_MAX, files: 1 },
});

/**
 * Vérification post-upload : taille maximale selon le type (image/vidéo).
 */
const enforceSizeByType = (req, res, next) => {
  if (!req.file) return next();
  const isImage = MIME_TYPES.IMAGE.includes(req.file.mimetype);
  const max = isImage ? IMAGE_MAX : VIDEO_MAX;
  if (req.file.size > max) {
    return next(new ApiError(400, `Fichier trop volumineux (maximum ${max / (1024 * 1024)} Mo pour les ${isImage ? 'images' : 'vidéos'})`));
  }
  req.file.kind = isImage ? 'image' : 'video';
  next();
};

module.exports = { upload, enforceSizeByType, IMAGE_MAX, VIDEO_MAX };
