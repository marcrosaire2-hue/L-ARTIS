/**
 * Modèle Message — message privé dans une conversation.
 * Statuts : sent -> delivered -> read (mis à jour côté API/Socket.IO).
 */
const mongoose = require('mongoose');
const { MESSAGE_STATUS } = require('../constants');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 4000,
      required: [true, 'Le message ne peut pas être vide'],
    },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
      },
    ],
    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUS),
      default: MESSAGE_STATUS.SENT,
    },
    readAt: { type: Date },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Pagination optimisée d'un fil : conversation + date
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, status: 1 });

module.exports = mongoose.model('Message', messageSchema);
