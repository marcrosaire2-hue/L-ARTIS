/**
 * Service avis — création (après devis terminé), réponse de l'artisan,
 * modération admin (approbation/masquage) avec recalcul de la note.
 */
const { Review, Artisan, Quote } = require('../models');
const ApiError = require('../utils/ApiError');
const { REVIEW_STATUS } = require('../constants');
const { notifyUser } = require('./notification.service');

/**
 * Recalcule la note moyenne d'un artisan à partir des avis approuvés.
 */
async function recalculateRating(artisanId) {
  const [result] = await Review.aggregate([
    { $match: { artisan: artisanId, status: REVIEW_STATUS.APPROVED } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Artisan.updateOne(
    { _id: artisanId },
    {
      $set: {
        'rating.average': result ? Math.round(result.avg * 10) / 10 : 0,
        'rating.count': result ? result.count : 0,
      },
    }
  );
}

/**
 * Le client laisse un avis après un devis terminé avec cet artisan.
 */
async function createReview(clientId, { artisanId, quoteId, rating, comment }) {
  if (!artisanId && !quoteId) {
    throw new ApiError(422, 'Artisan ou devis requis');
  }

  let artisan;
  if (quoteId) {
    const quote = await Quote.findById(quoteId);
    if (!quote) throw new ApiError(404, 'Devis introuvable');
    if (quote.client.toString() !== clientId.toString()) {
      throw new ApiError(403, 'Vous ne pouvez pas évaluer ce devis');
    }
    if (quote.status !== 'completed') {
      throw new ApiError(409, 'Vous ne pouvez évaluer qu\'après une prestation terminée');
    }
    artisan = await Artisan.findById(quote.artisan);
  } else {
    artisan = await Artisan.findOne({ _id: artisanId, status: 'validated' });
  }

  if (!artisan) throw new ApiError(404, 'Artisan introuvable');

  const existing = await Review.findOne({ artisan: artisan._id, client: clientId });
  if (existing) throw new ApiError(409, 'Vous avez déjà évalué cet artisan');

  // Publication immédiate : un client qui laisse un avis doit le voir
  // apparaître. La modération devient a posteriori — un administrateur peut
  // toujours masquer un avis depuis le panneau, ce qui recalcule la note.
  const review = await Review.create({
    artisan: artisan._id,
    client: clientId,
    quote: quoteId,
    rating,
    comment,
    status: REVIEW_STATUS.APPROVED,
  });

  await recalculateRating(artisan._id);

  await notifyUser(
    artisan.userId,
    'review_new',
    'Nouvel avis sur votre profil',
    `Un client vous a attribué ${rating}/5`,
    { reviewId: review._id, url: `/artisan/reviews` }
  );

  return review;
}

/**
 * Réponse publique de l'artisan à un avis.
 */
async function replyToReview(reviewId, artisanId, text) {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Avis introuvable');
  if (review.artisan.toString() !== artisanId.toString()) {
    throw new ApiError(403, 'Cet avis ne concerne pas votre profil');
  }
  if (review.status !== REVIEW_STATUS.APPROVED) {
    throw new ApiError(409, 'Réponse possible uniquement sur un avis approuvé');
  }

  review.reply = { text, repliedAt: new Date() };
  await review.save();
  return review;
}

/**
 * Avis publics d'un artisan (approuvés uniquement) avec pagination.
 */
async function listArtisanReviews(artisanId, { page = 1, limit = 10 }) {
  const artisan = await Artisan.findOne({ artisanId }).select('_id');
  if (!artisan) throw new ApiError(404, 'Artisan introuvable');

  return Review.paginate({
    page,
    limit,
    filters: { artisan: artisan._id, status: REVIEW_STATUS.APPROVED },
    sort: { createdAt: -1 },
    populate: [{ path: 'client', select: 'firstName lastName avatar' }],
    select: 'rating comment reply createdAt',
  });
}

module.exports = {
  createReview,
  replyToReview,
  listArtisanReviews,
  recalculateRating,
};
