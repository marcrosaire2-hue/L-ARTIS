/**
 * Service messagerie — conversations et messages privés client ↔ artisan.
 */
const mongoose = require('mongoose');
const { Conversation, Message, Artisan, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { PAGINATION, MESSAGE_STATUS } = require('../constants');
const { notifyUser } = require('./notification.service');
const { emitToUser } = require('./realtime.service');

function sortParticipantIds(a, b) {
  return String(a) < String(b) ? [a, b] : [b, a];
}

async function findConversationBetween(userA, userB) {
  const [first, second] = sortParticipantIds(userA, userB);
  return Conversation.findOne({
    'participants.user': { $all: [first, second] },
    $expr: { $eq: [{ $size: '$participants' }, 2] },
  });
}

/**
 * Ouvre (ou retrouve) une conversation avec un artisan.
 */
async function openConversation(userId, { artisanId, quoteId }) {
  const artisan = await Artisan.findById(artisanId).select('userId displayName status');
  if (!artisan) throw new ApiError(404, 'Artisan introuvable');
  if (String(artisan.userId) === String(userId)) {
    throw new ApiError(400, 'Vous ne pouvez pas discuter avec vous-même');
  }

  let conversation = await findConversationBetween(userId, artisan.userId);
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [
        { user: userId, unreadCount: 0 },
        { user: artisan.userId, unreadCount: 0 },
      ],
      artisan: artisan._id,
      quote: quoteId || undefined,
    });
  } else if (quoteId && !conversation.quote) {
    conversation.quote = quoteId;
    await conversation.save();
  }

  return serializeConversation(conversation, userId);
}

async function listConversations(userId, { page = 1, limit = PAGINATION.DEFAULT_LIMIT }) {
  const filters = { 'participants.user': userId, isArchived: false };
  const result = await Conversation.paginate({
    page,
    limit,
    filters,
    sort: { lastMessageAt: -1, updatedAt: -1 },
    populate: [
      { path: 'participants.user', select: 'firstName lastName avatar role' },
      { path: 'artisan', select: 'displayName profilePhoto artisanId' },
      { path: 'lastMessage' },
    ],
  });

  result.items = result.items.map((conv) => serializeConversation(conv, userId));
  return result;
}

async function getConversation(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId)
    .populate('participants.user', 'firstName lastName avatar role')
    .populate('artisan', 'displayName profilePhoto artisanId')
    .populate('lastMessage');
  if (!conversation) throw new ApiError(404, 'Conversation introuvable');
  assertParticipant(conversation, userId);
  return serializeConversation(conversation, userId);
}

async function listMessages(conversationId, userId, { page = 1, limit = 40 }) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new ApiError(404, 'Conversation introuvable');
  assertParticipant(conversation, userId);

  const result = await Message.paginate({
    page,
    limit,
    filters: { conversation: conversationId },
    sort: { createdAt: -1 },
    populate: [{ path: 'sender', select: 'firstName lastName avatar' }],
  });

  // Marquer comme lus les messages reçus
  await Message.updateMany(
    { conversation: conversationId, receiver: userId, status: { $ne: MESSAGE_STATUS.READ } },
    { $set: { status: MESSAGE_STATUS.READ, readAt: new Date() } }
  );
  const participant = conversation.participants.find((p) => String(p.user) === String(userId));
  if (participant) {
    participant.unreadCount = 0;
    participant.lastReadAt = new Date();
    await conversation.save();
  }

  result.items = result.items.reverse();
  return result;
}

async function sendMessage(conversationId, senderId, { content }) {
  const text = String(content || '').trim();
  if (!text) throw new ApiError(400, 'Le message ne peut pas être vide');

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new ApiError(404, 'Conversation introuvable');
  assertParticipant(conversation, senderId);
  if (conversation.blockedBy) {
    throw new ApiError(403, 'Cette conversation est bloquée');
  }

  const receiverParticipant = conversation.participants.find(
    (p) => String(p.user) !== String(senderId)
  );
  if (!receiverParticipant) throw new ApiError(400, 'Destinataire introuvable');

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    receiver: receiverParticipant.user,
    content: text,
    status: MESSAGE_STATUS.SENT,
  });

  receiverParticipant.unreadCount = (receiverParticipant.unreadCount || 0) + 1;
  conversation.lastMessage = message._id;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  const sender = await User.findById(senderId).select('firstName lastName');
  const preview = text.slice(0, 80);
  await notifyUser(
    receiverParticipant.user,
    'message_new',
    'Nouveau message',
    `${sender?.firstName || 'Quelqu’un'} : ${preview}`,
    { conversationId: String(conversationId), messageId: String(message._id) }
  );

  emitToUser(receiverParticipant.user, 'message:new', {
    conversationId: String(conversationId),
    message: message.toObject(),
  });
  emitToUser(senderId, 'message:sent', {
    conversationId: String(conversationId),
    message: message.toObject(),
  });

  return message;
}

function assertParticipant(conversation, userId) {
  const ok = conversation.participants.some((p) => String(p.user) === String(userId));
  if (!ok) throw new ApiError(403, 'Accès refusé à cette conversation');
}

function serializeConversation(conversation, userId) {
  const doc = conversation.toObject ? conversation.toObject() : conversation;
  const me = (doc.participants || []).find((p) => String(p.user?._id || p.user) === String(userId));
  const other = (doc.participants || []).find((p) => String(p.user?._id || p.user) !== String(userId));
  return {
    ...doc,
    unreadCount: me?.unreadCount || 0,
    otherParticipant: other?.user || null,
  };
}

module.exports = {
  openConversation,
  listConversations,
  getConversation,
  listMessages,
  sendMessage,
};
