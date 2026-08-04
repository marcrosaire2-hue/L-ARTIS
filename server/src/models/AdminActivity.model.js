/**
 * Modèle AdminActivity — journal des effets concrets des actions admin.
 * Chaque entrée décrit qui a agi, sur quoi, et quel a été l'impact.
 */
const mongoose = require('mongoose');
const paginatePlugin = require('./plugins/paginate.plugin');

const adminActivitySchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['artisan', 'user', 'review', 'admin', 'category', 'trade', 'system'],
      default: 'system',
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Empreinte réseau de l'action (effet « physique » côté connexion)
    ip: { type: String, default: '', maxlength: 80 },
    userAgent: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminActivitySchema.index({ createdAt: -1 });
adminActivitySchema.index({ actor: 1, createdAt: -1 });
adminActivitySchema.index({ action: 1, createdAt: -1 });

paginatePlugin(adminActivitySchema);

module.exports = mongoose.model('AdminActivity', adminActivitySchema);
