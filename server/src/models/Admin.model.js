/**
 * Modèle Admin — profils administrateurs.
 * roleAdmin hiérarchise les permissions (super > manager > moderator).
 */
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    roleAdmin: {
      type: String,
      enum: ['super', 'manager', 'moderator'],
      default: 'moderator',
    },
    permissions: {
      users: { type: Boolean, default: true },
      artisans: { type: Boolean, default: true },
      categories: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
      quotes: { type: Boolean, default: false },
      statistics: { type: Boolean, default: false },
      settings: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
