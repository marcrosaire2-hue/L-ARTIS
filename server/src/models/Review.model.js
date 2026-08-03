/**
 * Modèle Review — avis laissé par un client sur un artisan.
 * Modéré par l'admin (pending -> approved | hidden).
 */
const mongoose = require('mongoose');
const paginatePlugin = require('./plugins/paginate.plugin');
const { REVIEW_STATUS } = require('../constants');

const reviewSchema = new mongoose.Schema(
  {
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artisan',
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
    },
    rating: {
      type: Number,
      required: [true, 'La note est obligatoire'],
      min: [1, 'Note minimale : 1'],
      max: [5, 'Note maximale : 5'],
    },
    comment: {
      type: String,
      required: [true, 'Le commentaire est obligatoire'],
      trim: true,
      minlength: 3,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: Object.values(REVIEW_STATUS),
      default: REVIEW_STATUS.PENDING,
      index: true,
    },
    reply: {
      text: { type: String, trim: true, maxlength: 1000 },
      repliedAt: { type: Date },
    },
    moderationBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
  },
  { timestamps: true }
);

// Un client ne peut noter qu'une fois le même artisan
reviewSchema.index({ artisan: 1, client: 1 }, { unique: true });
reviewSchema.index({ artisan: 1, status: 1, createdAt: -1 });

paginatePlugin(reviewSchema);

module.exports = mongoose.model('Review', reviewSchema);
