/**
 * Contrôleur uploads.
 */
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const uploadService = require('../services/upload.service');

const uploadMedia = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(422).json({
      success: false,
      statusCode: 422,
      message: 'Aucun fichier reçu (champ "file" attendu)',
    });
  }
  const media = await uploadService.saveUploadedMedia(req.user._id, req.file);
  res.status(201).json(
    ApiResponse.created('Fichier uploadé', {
      id: media._id,
      url: media.url,
      kind: media.kind,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
    })
  );
});

const deleteMedia = catchAsync(async (req, res) => {
  await uploadService.deleteMedia(req.params.id, req.user._id);
  res.json(ApiResponse.ok('Média supprimé'));
});

module.exports = { uploadMedia, deleteMedia };
