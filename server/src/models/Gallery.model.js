/**
 * Modèle Gallery — galerie photo/vidéo d'un artisan.
 * items : références Media ordonnées (drag & drop, légendes).
 */
const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema(
  {
    media: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
    },
    caption: { type: String, trim: true, maxlength: 200, default: '' },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const gallerySchema = new mongoose.Schema(
  {
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artisan',
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, trim: true, maxlength: 100, default: 'Galerie' },
    items: {
      type: [galleryItemSchema],
      validate: {
        validator: (arr) => arr.length <= 30,
        message: 'Maximum 30 médias par galerie',
      },
      default: [],
    },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gallery', gallerySchema);
