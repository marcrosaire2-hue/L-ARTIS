/**
 * Modèle Quote — demande de devis envoyée par un client à un artisan.
 * Cycle de vie : pending -> accepted | rejected -> completed
 */
const mongoose = require('mongoose');
const paginatePlugin = require('./plugins/paginate.plugin');
const { QUOTE_STATUS } = require('../constants');

const quoteSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true, index: true },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artisan',
      required: true,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
    title: {
      type: String,
      required: [true, 'Un titre pour la demande est obligatoire'],
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Décrivez votre besoin'],
      trim: true,
      minlength: 10,
      maxlength: 3000,
    },
    budget: {
      min: { type: Number, min: 0, default: 0 },
      max: { type: Number, min: 0, default: 0 },
      currency: { type: String, default: 'XOF', maxlength: 5 },
    },
    preferredDate: { type: Date },
    location: {
      commune: { type: String, trim: true, default: '' },
      district: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '', maxlength: 200 },
    },
    status: {
      type: String,
      enum: Object.values(QUOTE_STATUS),
      default: QUOTE_STATUS.PENDING,
      index: true,
    },
    response: {
      price: { type: Number, min: 0 },
      durationDays: { type: Number, min: 1 },
      message: { type: String, trim: true, maxlength: 2000 },
      respondedAt: { type: Date },
    },
    clientNotes: { type: String, trim: true, maxlength: 1000, default: '' },
    cancelledAt: { type: Date },
    cancelReason: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

// Génération d'une référence lisible : DEV-2026-000123
quoteSchema.pre('save', async function (next) {
  if (this.reference) return next();
  const year = new Date().getFullYear();
  const count = await mongoose.model('Quote').countDocuments();
  this.reference = `DEV-${year}-${String(count + 1).padStart(6, '0')}`;
  next();
});

// Index de listing par artisan et par client
quoteSchema.index({ artisan: 1, status: 1, createdAt: -1 });
quoteSchema.index({ client: 1, status: 1, createdAt: -1 });

paginatePlugin(quoteSchema);

module.exports = mongoose.model('Quote', quoteSchema);
