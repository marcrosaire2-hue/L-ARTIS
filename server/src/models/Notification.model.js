/**
 * Modèle Notification — centre de notifications (utilisateurs + admin).
 */
const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../constants');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, trim: true, maxlength: 500, default: '' },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      comment: 'Payload libre : { quoteId, artisanId, url, ... }',
    },
    readAt: { type: Date },
    isAdminOnly: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ isAdminOnly: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
