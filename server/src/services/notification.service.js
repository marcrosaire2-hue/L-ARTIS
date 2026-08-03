/**
 * Service de notifications — crée les enregistrements Notification.
 * (Le push temps réel Socket.IO sera branché en Phase 5.)
 */
const { Notification, User } = require('../models');

/**
 * Notifie un utilisateur précis.
 */
async function notifyUser(userId, type, title, message = '', data = {}) {
  return Notification.create({ user: userId, type, title, message, data });
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

module.exports = { notifyUser, notifyAdmins };
