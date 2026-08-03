/**
 * Contrôleur notifications (utilisateur connecté).
 */
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const notificationService = require('../services/notification.service');

const listMine = catchAsync(async (req, res) => {
  const data = await notificationService.listMyNotifications(req.user._id, req.query);
  res.json(ApiResponse.ok('Notifications récupérées', data));
});

const markRead = catchAsync(async (req, res) => {
  const data = await notificationService.markAsRead(req.user._id, req.params.id);
  res.json(ApiResponse.ok('Notification lue', data));
});

const markAllRead = catchAsync(async (req, res) => {
  const data = await notificationService.markAllAsRead(req.user._id);
  res.json(ApiResponse.ok('Toutes les notifications ont été marquées comme lues', data));
});

module.exports = { listMine, markRead, markAllRead };
