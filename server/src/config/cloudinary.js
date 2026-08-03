/**
 * Configuration Cloudinary — stockage cloud des images/vidéos.
 * Champs de transformation : compressés, format moderne (WebP/AVIF),
 * qualité optimisée pour le web.
 */
const cloudinary = require('cloudinary').v2;

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
    timeout: 180000,
  });
}

const CLOUDINARY_OPTS = Object.freeze({
  image: {
    folder: 'artisans-marketplace/images',
    resource_type: 'image',
    transformation: [
      { width: 1600, crop: 'limit' },
      { quality: 'auto:good', fetch_format: 'auto' },
    ],
  },
  video: {
    folder: 'artisans-marketplace/videos',
    resource_type: 'video',
    transformation: [{ quality: 'auto:good' }],
  },
});

module.exports = { cloudinary, CLOUDINARY_OPTS };
