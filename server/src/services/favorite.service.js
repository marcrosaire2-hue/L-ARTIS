/**
 * Service favoris — le client enregistre des artisans favoris.
 */
const { Favorite, Artisan } = require('../models');
const ApiError = require('../utils/ApiError');
const { PAGINATION } = require('../constants');

async function addFavorite(clientId, artisanId) {
  const artisan = await Artisan.findOne({ _id: artisanId, status: 'validated' });
  if (!artisan) throw new ApiError(404, 'Artisan introuvable');

  const existing = await Favorite.findOne({ client: clientId, artisan: artisanId });
  if (existing) throw new ApiError(409, 'Cet artisan est déjà dans vos favoris');

  const favorite = await Favorite.create({ client: clientId, artisan: artisanId });
  await Artisan.updateOne({ _id: artisanId }, { $inc: { favoriteCount: 1 } });
  return favorite;
}

async function removeFavorite(clientId, artisanId) {
  const result = await Favorite.deleteOne({ client: clientId, artisan: artisanId });
  if (result.deletedCount === 0) throw new ApiError(404, 'Favori introuvable');
  await Artisan.updateOne(
    { _id: artisanId, favoriteCount: { $gt: 0 } },
    { $inc: { favoriteCount: -1 } }
  );
}

async function listFavorites(clientId, { page = 1, limit = PAGINATION.DEFAULT_LIMIT }) {
  return Favorite.paginate({
    page,
    limit,
    filters: { client: clientId },
    sort: { createdAt: -1 },
    populate: [
      {
        path: 'artisan',
        select:
          'artisanId displayName tagline profilePhoto rating pricing location.commune location.department availability isVerified',
      },
    ],
  });
}

module.exports = { addFavorite, removeFavorite, listFavorites };
