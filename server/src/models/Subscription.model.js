/**
 * Modèle Subscription — abonnement SaaS d'un artisan
 * (plans : basic, pro, business ; périodes : mensuel, annuel).
 */
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artisan',
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['basic', 'pro', 'business'],
      default: 'basic',
      index: true,
    },
    features: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      comment: "Instantané des features du plan (galerie limitée, promotions...)"
    },
    price: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: 'XOF', maxlength: 5 },
    period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['active', 'canceled', 'expired', 'past_due'],
      default: 'active',
      index: true,
    },
    canceledAt: { type: Date },
  },
  { timestamps: true }
);

subscriptionSchema.index({ status: 1, endDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
