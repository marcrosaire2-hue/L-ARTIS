/**
 * Modèle Conversation — fil de discussion entre un client et un artisan.
 * Compteurs de non-lus par participant pour l'UI.
 */
const mongoose = require('mongoose');
const paginatePlugin = require('./plugins/paginate.plugin');

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    unreadCount: { type: Number, default: 0, min: 0 },
    lastReadAt: { type: Date, default: null },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [participantSchema],
      validate: {
        validator: (arr) => arr.length === 2,
        message: 'Une conversation doit avoir exactement 2 participants',
      },
    },
    quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artisan',
      index: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: { type: Date, index: true },
    isArchived: { type: Boolean, default: false },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Unicité de la paire de participants : garantit une seule conversation
// entre deux utilisateurs (déterminisme sur l'ordre des ObjectId)
conversationSchema.index(
  { 'participants.user': 1 },
  { unique: false }
);
conversationSchema.index(
  { 'participants.user': 1, lastMessageAt: -1 }
);

paginatePlugin(conversationSchema);

module.exports = mongoose.model('Conversation', conversationSchema);
