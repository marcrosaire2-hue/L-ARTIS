/**
 * Modèle Service — prestation publiée par un artisan.
 */
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artisan',
      required: true,
      index: true,
    },
    trade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trade',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Le titre du service est obligatoire'],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    price: { type: Number, required: true, min: 0 },
    priceUnit: {
      type: String,
      enum: ['heure', 'jour', 'forfait', 'projet'],
      default: 'forfait',
    },
    durationMin: { type: Number, min: 5, default: 60 },
    images: [{ type: String, default: [] }],
    isActive: { type: Boolean, default: true, index: true },
    isPromoted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index listing par artisan et par métier
serviceSchema.index({ artisan: 1, isActive: 1 });
serviceSchema.index({ trade: 1, price: 1 });

module.exports = mongoose.model('Service', serviceSchema);
