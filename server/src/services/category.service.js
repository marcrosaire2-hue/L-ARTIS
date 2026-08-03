/**
 * Service catégories & métiers (hiérarchie Catégorie -> Métiers).
 */
const { Category, Trade } = require('../models');
const ApiError = require('../utils/ApiError');
const slugify = require('../utils/slugify');
const { PAGINATION } = require('../constants');

/* ------------------------------------------------------------------ */
/* Public                                                              */
/* ------------------------------------------------------------------ */

async function listCategories() {
  return Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
}

async function getCategoryBySlug(slug) {
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) throw new ApiError(404, 'Catégorie introuvable');

  const trades = await Trade.find({ category: category._id, isActive: true })
    .sort({ name: 1 })
    .lean();

  return { ...category, trades };
}

async function listTrades({ categoryId, page = 1, limit = PAGINATION.DEFAULT_LIMIT }) {
  const filters = { isActive: true };
  if (categoryId) filters.category = categoryId;

  const result = await Trade.paginate({
    page,
    limit,
    filters,
    sort: { name: 1 },
    populate: [{ path: 'category', select: 'name slug' }],
  });
  return result;
}

/* ------------------------------------------------------------------ */
/* Administration                                                      */
/* ------------------------------------------------------------------ */

async function createCategory({ name, description, icon, image, sortOrder }) {
  const slug = slugify(name);
  const exists = await Category.findOne({ slug });
  if (exists) throw new ApiError(409, 'Cette catégorie existe déjà');

  return Category.create({ name, slug, description, icon, image, sortOrder });
}

async function updateCategory(categoryId, data) {
  const category = await Category.findById(categoryId);
  if (!category) throw new ApiError(404, 'Catégorie introuvable');

  if (data.name && data.name !== category.name) {
    const slug = slugify(data.name);
    const conflict = await Category.findOne({ slug, _id: { $ne: categoryId } });
    if (conflict) throw new ApiError(409, 'Une autre catégorie porte ce nom');
    category.slug = slug;
  }

  ['name', 'description', 'icon', 'image', 'sortOrder', 'isActive'].forEach((key) => {
    if (data[key] !== undefined) category[key] = data[key];
  });

  await category.save();
  return category;
}

async function deleteCategory(categoryId) {
  const category = await Category.findById(categoryId);
  if (!category) throw new ApiError(404, 'Catégorie introuvable');

  const trades = await Trade.countDocuments({ category: categoryId });
  if (trades > 0) {
    throw new ApiError(409, `Supprimez d'abord les ${trades} métier(s) de cette catégorie`);
  }

  await category.deleteOne();
}

async function createTrade({ name, categoryId, description, icon, image }) {
  const category = await Category.findById(categoryId);
  if (!category) throw new ApiError(404, 'Catégorie introuvable');

  const trade = await Trade.create({
    name,
    slug: slugify(name),
    category: categoryId,
    description,
    icon,
    image,
  });
  await refreshCategoryCounts(categoryId);
  return trade;
}

async function updateTrade(tradeId, data) {
  const trade = await Trade.findById(tradeId);
  if (!trade) throw new ApiError(404, 'Métier introuvable');

  if (data.category && data.category !== trade.category.toString()) {
    const category = await Category.findById(data.category);
    if (!category) throw new ApiError(404, 'Catégorie introuvable');
  }

  ['name', 'description', 'icon', 'image', 'isActive', 'category'].forEach((key) => {
    if (data[key] !== undefined) trade[key] = data[key];
  });
  if (data.name && data.name !== trade.name) trade.slug = slugify(data.name);

  await trade.save();
  await refreshCategoryCounts(trade.category);
  return trade;
}

async function deleteTrade(tradeId) {
  const trade = await Trade.findById(tradeId);
  if (!trade) throw new ApiError(404, 'Métier introuvable');

  await trade.deleteOne();
  await refreshCategoryCounts(trade.category);
}

/**
 * Recalcule le nombre de métiers actifs par catégorie.
 */
async function refreshCategoryCounts(categoryId) {
  const count = await Trade.countDocuments({ category: categoryId, isActive: true });
  await Category.updateOne({ _id: categoryId }, { $set: { tradeCount: count } });
}

module.exports = {
  listCategories,
  getCategoryBySlug,
  listTrades,
  createCategory,
  updateCategory,
  deleteCategory,
  createTrade,
  updateTrade,
  deleteTrade,
};
