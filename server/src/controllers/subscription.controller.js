const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const subscriptionService = require('../services/subscription.service');

const listPlans = catchAsync(async (_req, res) => {
  res.json(ApiResponse.ok('Plans disponibles', subscriptionService.listPlans()));
});

const getMine = catchAsync(async (req, res) => {
  const data = await subscriptionService.getMySubscription(req.artisan._id);
  res.json(ApiResponse.ok('Abonnement', data));
});

const subscribe = catchAsync(async (req, res) => {
  const data = await subscriptionService.subscribe(req.artisan._id, req.body);
  res.json(ApiResponse.ok('Abonnement mis à jour', data));
});

const cancel = catchAsync(async (req, res) => {
  const data = await subscriptionService.cancelSubscription(req.artisan._id);
  res.json(ApiResponse.ok('Abonnement annulé', data));
});

module.exports = { listPlans, getMine, subscribe, cancel };
