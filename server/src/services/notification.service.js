/**
 * Service de notifications — crée et lit les enregistrements Notification.
 * (Le push temps réel Socket.IO sera branché en Phase 5.)
 */
const { Notification, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { PAGINATION } = require('../constants');
const { emitToUser } = require('./realtime.service');

/**
 * Notifie un utilisateur précis.
 */
async function notifyUser(userId, type, title, message = '', data = {}) {
  const doc = await Notification.create({ user: userId, type, title, message, data });
  emitToUser(userId, 'notification:new', {
    id: String(doc._id),
    type,
    title,
    message,
    data,
    createdAt: doc.createdAt,
  });
  return doc;
}

/**
 * Notifie tous les administrateurs (ex : nouveau signalement, inscription artisan).
 */
async function notifyAdmins(type, title, message = '', data = {}) {
  const admins = await User.find({ role: 'admin', accountStatus: 'active' }).select('_id');
  const docs = admins.map((a) => ({
    user: a._id,
    type,
    title,
    message,
    data: { ...data, isAdminOnly: true },
  }));
  if (docs.length) await Notification.insertMany(docs);
  return docs.length;
}

async function listMyNotifications(userId, { page = 1, limit = PAGINATION.DEFAULT_LIMIT, unreadOnly }) {
  const filters = { user: userId };
  if (unreadOnly === 'true' || unreadOnly === true) {
    filters.readAt = null;
  }

  const [pageResult, unreadCount] = await Promise.all([
    Notification.paginate({
      page,
      limit,
      filters,
      sort: { createdAt: -1 },
    }),
    Notification.countDocuments({ user: userId, readAt: null }),
  ]);

  return { ...pageResult, unreadCount };
}

async function markAsRead(userId, notificationId) {
  const doc = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  if (!doc) {
    const exists = await Notification.exists({ _id: notificationId, user: userId });
    if (!exists) throw new ApiError(404, 'Notification introuvable');
    return Notification.findById(notificationId);
  }
  return doc;
}

async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    { user: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );
  return { modifiedCount: result.modifiedCount };
}

module.exports = {
  notifyUser,
  notifyAdmins,
  listMyNotifications,
  markAsRead,
  markAllAsRead,
};
