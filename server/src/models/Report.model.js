/**
 * Modèle Report — signalement d'un profil, d'un avis, d'un devis ou d'un message.
 * Traité par un administrateur (pending -> reviewed | dismissed).
 */
const mongoose = require('mongoose');
const paginatePlugin = require('./plugins/paginate.plugin');
const { REPORT_STATUS } = require('../constants');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['artisan', 'review', 'quote', 'message'],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetRef',
      index: true,
    },
    targetRef: {
      type: String,
      enum: ['Artisan', 'Review', 'Quote', 'Message'],
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'profil_frauduleux',
        'fausses_informations',
        'comportement_inapproprie',
        'arnaque',
        'spam',
        'contenu_illicite',
        'autre',
      ],
      required: [true, 'Veuillez choisir un motif de signalement'],
    },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.PENDING,
      index: true,
    },
    resolutionNote: { type: String, trim: true, maxlength: 1000, default: '' },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    handledAt: { type: Date },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

paginatePlugin(reportSchema);

module.exports = mongoose.model('Report', reportSchema);
