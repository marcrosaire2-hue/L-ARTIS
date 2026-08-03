/**
 * Plugin Mongoose DRY : ajoute une méthode statique `paginate` à chaque modèle.
 *
 * const result = await Model.paginate({
 *   page: 1,
 *   limit: 12,
 *   filters: { status: 'validated' },
 *   sort: { createdAt: -1 },
 *   select: '-password',
 *   populate: [{ path: 'location', select: 'city' }],
 * });
 *
 * Retourne : { items, page, limit, totalItems, totalPages, hasNextPage, hasPrevPage }
 */
const paginatePlugin = (schema) => {
  schema.statics.paginate = async function paginate({
    page = 1,
    limit = 12,
    filters = {},
    sort = { createdAt: -1 },
    select = '',
    populate = [],
  } = {}) {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const query = this.find(filters);
    if (select) query.select(select);
    if (populate && populate.length) query.populate(populate);

    const [items, totalItems] = await Promise.all([
      query.sort(sort).skip(skip).limit(safeLimit).exec(),
      this.countDocuments(filters),
    ]);

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
  };
};

module.exports = paginatePlugin;
