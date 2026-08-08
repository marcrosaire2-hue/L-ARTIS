/**
 * Service uploads — envoi des fichiers vers Cloudinary,
 * enregistrement du document Media, suppression (cloud + références).
 */
const { Media, Gallery, Service } = require('../models');
const ApiError = require('../utils/ApiError');
const { cloudinary, CLOUDINARY_OPTS } = require('../config/cloudinary');

/**
 * Crée le document Media après upload Cloudinary.
 * req.file contient le buffer (stockage mémoire).
 */
async function saveUploadedMedia(uploadedBy, file) {
  const opts = CLOUDINARY_OPTS[file.kind === 'video' ? 'video' : 'image'];

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: opts.folder,
        resource_type: opts.resource_type,
        transformation: opts.transformation,
        use_filename: false,
        unique_filename: true,
        agent: false,
      },
      (error, uploadResult) => (error ? reject(error) : resolve(uploadResult))
    ).end(file.buffer);
  });

  const media = await Media.create({
    uploadedBy,
    kind: file.kind || 'image',
    url: result.secure_url,
    publicId: result.public_id,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    width: result.width,
    height: result.height,
    durationSec: result.duration || undefined,
    folder: file.kind === 'video' ? 'videos' : 'images',
  });

  return media;
}

/**
 * Efface le fichier distant, le document Media et ses références.
 * Sans contrôle de propriété : réservé aux appelants qui l'ont déjà établi
 * (suppression d'une réalisation par son artisan, par exemple).
 */
async function removeMediaFile(mediaId) {
  const media = await Media.findById(mediaId);
  if (!media) return;

  // Suppression dans le cloud (ignorer si le fichier n'existe plus)
  await cloudinary.uploader
    .destroy(media.publicId, { resource_type: media.kind === 'video' ? 'video' : 'image' })
    .catch(() => {});

  await Promise.all([
    Gallery.updateMany({ 'items.media': media._id }, { $pull: { items: { media: media._id } } }),
    Service.updateMany({ media: media._id }, { $pull: { media: media._id } }),
  ]);
  await media.deleteOne();
}

/**
 * Suppression demandée par un utilisateur : la propriété est vérifiée ici.
 */
async function deleteMedia(mediaId, userId) {
  const media = await Media.findById(mediaId);
  if (!media) throw new ApiError(404, 'Média introuvable');

  const isOwner = media.uploadedBy.toString() === userId.toString();
  if (!isOwner) throw new ApiError(403, 'Vous ne pouvez pas supprimer ce média');

  await removeMediaFile(media._id);
}

module.exports = { saveUploadedMedia, deleteMedia, removeMediaFile };
