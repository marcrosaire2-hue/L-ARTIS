/**
 * Service abonnements artisans — plans basic / pro / business (XOF).
 * Activation manuelle (paiement Mobile Money à brancher ultérieurement).
 */
const { Subscription, Artisan } = require('../models');
const ApiError = require('../utils/ApiError');

const PLANS = {
  basic: {
    plan: 'basic',
    priceMonthly: 0,
    priceYearly: 0,
    label: 'Gratuit',
    features: {
      maxGallery: 6,
      featured: false,
      prioritySupport: false,
      analytics: false,
    },
  },
  pro: {
    plan: 'pro',
    priceMonthly: 5000,
    priceYearly: 50000,
    label: 'Pro',
    features: {
      maxGallery: 30,
      featured: true,
      prioritySupport: false,
      analytics: true,
    },
  },
  business: {
    plan: 'business',
    priceMonthly: 12000,
    priceYearly: 120000,
    label: 'Business',
    features: {
      maxGallery: 100,
      featured: true,
      prioritySupport: true,
      analytics: true,
    },
  },
};

function listPlans() {
  return Object.values(PLANS).map((p) => ({
    plan: p.plan,
    label: p.label,
    priceMonthly: p.priceMonthly,
    priceYearly: p.priceYearly,
    currency: 'XOF',
    features: p.features,
  }));
}

async function getMySubscription(artisanId) {
  let sub = await Subscription.findOne({ artisan: artisanId });
  if (!sub) {
    const now = new Date();
    const end = new Date(now);
    end.setFullYear(end.getFullYear() + 10);
    sub = await Subscription.create({
      artisan: artisanId,
      plan: 'basic',
      features: PLANS.basic.features,
      price: 0,
      period: 'yearly',
      startDate: now,
      endDate: end,
      status: 'active',
    });
  }
  return sub;
}

async function subscribe(artisanId, { plan, period = 'monthly' }) {
  const definition = PLANS[plan];
  if (!definition) throw new ApiError(400, 'Plan invalide');
  if (!['monthly', 'yearly'].includes(period)) throw new ApiError(400, 'Période invalide');

  const artisan = await Artisan.findById(artisanId);
  if (!artisan) throw new ApiError(404, 'Profil artisan introuvable');

  const price = period === 'yearly' ? definition.priceYearly : definition.priceMonthly;
  const startDate = new Date();
  const endDate = new Date(startDate);
  if (period === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
  else endDate.setMonth(endDate.getMonth() + 1);

  // Mise en avant si plan pro/business
  if (definition.features.featured) {
    artisan.isFeatured = true;
    await artisan.save();
  }

  const sub = await Subscription.findOneAndUpdate(
    { artisan: artisanId },
    {
      plan,
      features: definition.features,
      price,
      currency: 'XOF',
      period,
      startDate,
      endDate,
      status: 'active',
      autoRenew: true,
      canceledAt: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    subscription: sub,
    payment: {
      method: 'manual',
      amount: price,
      currency: 'XOF',
      note:
        price === 0
          ? 'Plan gratuit activé.'
          : 'Abonnement activé. Branchez Fedapay / Mobile Money pour encaisser réellement.',
    },
  };
}

async function cancelSubscription(artisanId) {
  const sub = await Subscription.findOne({ artisan: artisanId });
  if (!sub) throw new ApiError(404, 'Aucun abonnement');
  sub.status = 'canceled';
  sub.autoRenew = false;
  sub.canceledAt = new Date();
  await sub.save();

  const artisan = await Artisan.findById(artisanId);
  if (artisan) {
    artisan.isFeatured = false;
    await artisan.save();
  }
  return sub;
}

module.exports = {
  PLANS,
  listPlans,
  getMySubscription,
  subscribe,
  cancelSubscription,
};
