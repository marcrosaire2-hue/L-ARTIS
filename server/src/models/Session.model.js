/**
 * Modèle Session — sessions de refresh token (rotation sécurisée).
 * Un refresh token ne peut être utilisé qu'une fois ; les sessions
 * révoquées permettent la déconnexion et la détection de vol.
 */
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '', maxlength: 500 },
    device: { type: String, default: '', maxlength: 200 },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
    revokedReason: { type: String, default: '' },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

// Recherche rapide des sessions actives d'un utilisateur
sessionSchema.index({ user: 1, revokedAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);
