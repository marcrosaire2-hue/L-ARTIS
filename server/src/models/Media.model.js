/**
 * Modèle Media — fichier uploadé (image ou vidéo).
 * Référencé par : galleries, messages, services, avatars, logos...
 */
const mongoose = require('mongoose');
const { MIME_TYPES } = require('../constants');

const mediaSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['image', 'video'],
      required: true,
      index: true,
    },
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    mimeType: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return this.kind === 'image'
            ? MIME_TYPES.IMAGE.includes(value)
            : MIME_TYPES.VIDEO.includes(value);
        },
        message: 'Type MIME non autorisé',
      },
    },
    sizeBytes: { type: Number, min: 0, default: 0 },
    width: { type: Number },
    height: { type: Number },
    durationSec: { type: Number },
    folder: { type: String, default: 'general' },
    alt: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
);

mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ folder: 1 });

module.exports = mongoose.model('Media', mediaSchema);
