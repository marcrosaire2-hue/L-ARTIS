/**
 * Service artisans — recherche, fiche publique, gestion du profil,
 * services, galerie et statistiques du tableau de bord.
 */
const mongoose = require('mongoose');
const {
  Artisan,
  Trade,
  Gallery,
  Service,
  Quote,
  Review,
  Favorite,
  Media,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { PAGINATION } = require('../constants');

const PUBLIC_FIELDS = {
  artisanId: 1,
  displayName: 1,
  tagline: 1,
  bio: 1,
  profilePhoto: 1,
  logo: 1,
  coverPhoto: 1,
  trades: 1,
  skills: 1,
  yearsExperience: 1,
  pricing: 1,
  location: 1,
  workHours: 1,
  availability: 1,
  socialLinks: 1,
  contactPhone: 1,
  rating: 1,
  viewCount: 1,
  favoriteCount: 1,
  isVerified: 1,
  isFeatured: 1,
  createdAt: 1,
  distance: 1,
};

/* ------------------------------------------------------------------ */
/* Recherche optimisée                                                 */
/* ------------------------------------------------------------------ */

/**
 * Filtre texte de repli pour la recherche par distance.
 * MongoDB refuse $text dans un $geoNear, et n'accepte $match+$text qu'en
 * première position d'un pipeline : les deux index spéciaux (texte et
 * 2dsphere) ne peuvent pas servir à la même requête. On retombe donc sur
 * une regex insensible à la casse portant sur les mêmes champs que
 * l'index texte, appliquée après le $geoNear (qui a déjà réduit le lot).
 */
function textFallbackMatch(q) {
  const escaped = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(escaped, 'i');
  return { $or: [{ displayName: rx }, { tagline: rx }, { bio: rx }, { skills: rx }] };
}

/**
 * Recherche avec : texte, métier(s), catégorie, département, commune,
 * quartier, note min, prix max, disponibilité, distance (lat/lng).
 * Pagination + tri (pertinence, note, prix, distance, récents).
 */
async function searchArtisans({
  q,
  trade,
  category,
  department,
  commune,
  district,
  minRating,
  maxPrice,
  isAvailable,
  isFeatured,
  lat,
  lng,
  distance,
  sort = 'rating',
  page = 1,
  limit = PAGINATION.DEFAULT_LIMIT,
}) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), PAGINATION.MAX_LIMIT);
  const skip = (safePage - 1) * safeLimit;

  const filters = { status: 'validated' };
  if (department) filters['location.department'] = department;
  if (commune) filters['location.commune'] = commune;
  if (district) filters['location.district'] = district;
  if (minRating) filters['rating.average'] = { $gte: parseFloat(minRating) };
  if (maxPrice) filters['pricing.fromPrice'] = { $lte: parseFloat(maxPrice) };
  if (isAvailable === 'true' || isAvailable === true) filters['availability.isAvailable'] = true;
  if (isFeatured === 'true' || isFeatured === true) filters.isFeatured = true;

  // Les filtres alimentent un pipeline d'agrégation : Mongoose n'y applique
  // AUCUN cast automatique, les identifiants doivent donc être convertis en
  // ObjectId à la main (des chaînes ne matcheraient jamais).
  if (trade) {
    const tradeIds = String(trade)
      .split(',')
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    if (tradeIds.length) filters.trades = { $in: tradeIds };
  }

  const hasGeo = lat && lng && distance;

  const pipeline = [];

  if (hasGeo) {
    pipeline.push({
      $geoNear: {
        near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        distanceField: 'distance',
        maxDistance: parseFloat(distance) * 1000,
        spherical: true,
        query: filters,
      },
    });
    // Le texte ne peut pas être combiné à $geoNear (cf. textFallbackMatch)
    if (q) pipeline.push({ $match: textFallbackMatch(q) });
  } else {
    const match = { ...filters };
    if (q) match.$text = { $search: String(q) };
    pipeline.push({ $match: match });
  }

  // Filtre catégorie : artisans dont l'un des métiers appartient à la catégorie.
  // `distinct` renvoie directement des ObjectId ; `find().select('_id')`
  // renverrait des documents, qui ne matchent pas dans un $in.
  if (category && mongoose.Types.ObjectId.isValid(category)) {
    const tradeIds = await Trade.distinct('_id', { category, isActive: true });
    pipeline.push({ $match: { trades: { $in: tradeIds } } });
  }

  // Tri
  const sortStage =
    sort === 'price'
      ? { 'pricing.fromPrice': 1 }
      : sort === 'newest'
        ? { createdAt: -1 }
        : sort === 'distance' && hasGeo
          ? { distance: 1 }
          : { 'rating.average': -1, 'rating.count': -1 };

  pipeline.push({ $sort: sortStage });

  pipeline.push({
    $facet: {
      data: [
        { $skip: skip },
        { $limit: safeLimit },
        {
          $lookup: {
            from: 'trades',
            localField: 'trades',
            foreignField: '_id',
            as: 'trades',
          },
        },
        {
          $project: {
            ...PUBLIC_FIELDS,
            trades: {
              $map: {
                input: '$trades',
                as: 't',
                in: { id: '$$t._id', name: '$$t.name', slug: '$$t.slug' },
              },
            },
          },
        },
      ],
      total: [{ $count: 'count' }],
    },
  });

  const [result] = await Artisan.aggregate(pipeline);
  const items = result.data;
  const totalItems = result.total.length ? result.total[0].count : 0;
  const totalPages = Math.max(Math.ceil(totalItems / safeLimit), 1);

  return {
    items,
    page: safePage,
    limit: safeLimit,
    totalItems,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

/* ------------------------------------------------------------------ */
/* Fiche publique                                                      */
/* ------------------------------------------------------------------ */

async function getPublicProfile(artisanId) {
  const artisan = await Artisan.findOne({ artisanId, status: 'validated' })
    .populate('trades', 'name slug icon')
    .lean();

  if (!artisan) throw new ApiError(404, 'Artisan introuvable ou non publié');

  const [gallery, services, reviewsSummary] = await Promise.all([
    Gallery.findOne({ artisan: artisan._id, isPublic: true }).populate('items.media').lean(),
    Service.find({ artisan: artisan._id, isActive: true }).sort({ createdAt: -1 }).lean(),
    Review.aggregate([
      { $match: { artisan: artisan._id, status: 'approved' } },
      {
        $facet: {
          summary: [
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
          ],
          latest: [
            { $sort: { createdAt: -1 } },
            { $limit: 20 },
            { $lookup: { from: 'users', localField: 'client', foreignField: '_id', as: 'client' } },
            { $project: { rating: 1, comment: 1, createdAt: 1, 'client.firstName': 1, 'client.lastName': 1, 'client.avatar': 1 } },
          ],
        },
      },
    ]),
  ]);

  // Compteur de vues (fire-and-forget)
  Artisan.updateOne({ _id: artisan._id }, { $inc: { viewCount: 1 } }).catch(() => {});

  const summary = reviewsSummary[0].summary[0] || { avg: 0, count: 0 };

  return {
    artisan: {
      ...artisan,
      rating: {
        average: Math.round(summary.avg * 10) / 10,
        count: summary.count,
      },
    },
    gallery: gallery ? gallery.items.map((i) => ({ id: i._id, url: i.media?.url, kind: i.media?.kind, caption: i.caption })) : [],
    services,
    reviews: { items: reviewsSummary[0].latest, total: summary.count },
  };
}

/* ------------------------------------------------------------------ */
/* Gestion du profil (propriétaire)                                    */
/* ------------------------------------------------------------------ */

const PROFILE_FIELDS = [
  'displayName',
  'tagline',
  'bio',
  'profilePhoto',
  'logo',
  'coverPhoto',
  'trades',
  'skills',
  'yearsExperience',
  'pricing',
  'location',
  'workHours',
  'availability',
  'socialLinks',
  'contactPhone',
  'contactEmail',
];

async function updateProfile(artisanId, data) {
  const artisan = await Artisan.findById(artisanId);
  if (!artisan) throw new ApiError(404, 'Profil artisan introuvable');

  PROFILE_FIELDS.forEach((field) => {
    if (data[field] !== undefined) artisan[field] = data[field];
  });

  if (data.displayName && data.displayName !== artisan.displayName) {
    artisan.displayName = data.displayName;
  }

  await artisan.save();
  return artisan;
}

/* ------------------------------------------------------------------ */
/* Services de l'artisan                                               */
/* ------------------------------------------------------------------ */

async function listServices(artisanId) {
  return Service.find({ artisan: artisanId }).sort({ createdAt: -1 });
}

async function createService(artisanId, data) {
  return Service.create({ artisan: artisanId, ...data });
}

async function updateService(artisanId, serviceId, data) {
  const service = await Service.findOne({ _id: serviceId, artisan: artisanId });
  if (!service) throw new ApiError(404, 'Service introuvable');

  ['title', 'description', 'price', 'priceUnit', 'durationMin', 'images', 'isActive', 'isPromoted', 'trade'].forEach(
    (key) => {
      if (data[key] !== undefined) service[key] = data[key];
    }
  );
  await service.save();
  return service;
}

async function deleteService(artisanId, serviceId) {
  const service = await Service.findOne({ _id: serviceId, artisan: artisanId });
  if (!service) throw new ApiError(404, 'Service introuvable');
  await service.deleteOne();
}

/* ------------------------------------------------------------------ */
/* Galerie                                                             */
/* ------------------------------------------------------------------ */

/**
 * Remplace la galerie : items = [{ media: ObjectId, caption, sortOrder }].
 */
async function updateGallery(artisanId, items = []) {
  const gallery = await Gallery.findOneAndUpdate(
    { artisan: artisanId },
    { $set: { items } },
    { upsert: true, new: true }
  );
  return gallery;
}

async function addMediaToGallery(artisanId, mediaId, caption = '') {
  const gallery = await Gallery.findOneAndUpdate(
    { artisan: artisanId },
    { $push: { items: { media: mediaId, caption } } },
    { upsert: true, new: true }
  );
  return gallery;
}

async function removeMediaFromGallery(artisanId, galleryItemId) {
  const gallery = await Gallery.findOne({ artisan: artisanId });
  if (!gallery) throw new ApiError(404, 'Galerie introuvable');
  gallery.items = gallery.items.filter((i) => i._id.toString() !== galleryItemId);
  await gallery.save();
  return gallery;
}

/* ------------------------------------------------------------------ */
/* Statistiques du tableau de bord                                     */
/* ------------------------------------------------------------------ */

async function getDashboardStats(artisanId) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [quotes, pendingQuotes, completedQuotes, reviews, favorites, monthly, artisan] =
    await Promise.all([
      Quote.countDocuments({ artisan: artisanId }),
      Quote.countDocuments({ artisan: artisanId, status: 'pending' }),
      Quote.countDocuments({ artisan: artisanId, status: 'completed' }),
      Review.countDocuments({ artisan: artisanId, status: 'approved' }),
      Favorite.countDocuments({ artisan: artisanId }),
      Quote.aggregate([
        { $match: { artisan: artisanId, createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Artisan.findById(artisanId).select('viewCount rating favoriteCount'),
    ]);

  return {
    views: artisan.viewCount,
    favoriteCount: artisan.favoriteCount,
    rating: artisan.rating,
    quotes: { total: quotes, pending: pendingQuotes, completed: completedQuotes },
    reviewsCount: reviews,
    favorites: favorites,
    monthlyQuotes: monthly.map((m) => ({
      month: `${String(m._id.month).padStart(2, '0')}/${m._id.year}`,
      count: m.count,
    })),
  };
}

module.exports = {
  searchArtisans,
  getPublicProfile,
  updateProfile,
  listServices,
  createService,
  updateService,
  deleteService,
  updateGallery,
  addMediaToGallery,
  removeMediaFromGallery,
  getDashboardStats,
};
