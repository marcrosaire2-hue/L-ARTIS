/**
 * Modèle Client — informations complémentaires du client.
 * Les données d'identité/auth restent sur le User parent.
 */
const mongoose = require('mongoose');
const { REGEX } = require('../constants');

const clientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    address: { type: String, trim: true, maxlength: 200, default: '' },
    commune: { type: String, trim: true, maxlength: 100, default: '' },
    district: { type: String, trim: true, maxlength: 100, default: '' },
    country: { type: String, trim: true, maxlength: 100, default: 'Bénin' },
    emergencyPhone: {
      type: String,
      trim: true,
      match: [REGEX.PHONE, 'Téléphone invalide'],
    },
    preferredContact: {
      type: String,
      enum: ['email', 'phone', 'whatsapp'],
      default: 'email',
    },
    savedTrades: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trade',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
