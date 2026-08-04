/**
 * Contrôleur catégories & métiers.
 */
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const categoryService = require('../services/category.service');
const activityService = require('../services/activity.service');

const listCategories = catchAsync(async (req, res) => {
  const data = await categoryService.listCategories();
  res.json(ApiResponse.ok('Catégories récupérées', data));
});

const getCategoryBySlug = catchAsync(async (req, res) => {
  const data = await categoryService.getCategoryBySlug(req.params.slug);
  res.json(ApiResponse.ok('Catégorie récupérée', data));
});

const listTrades = catchAsync(async (req, res) => {
  const data = await categoryService.listTrades(req.query);
  res.json(ApiResponse.ok('Métiers récupérés', data));
});

const createCategory = catchAsync(async (req, res) => {
  const data = await categoryService.createCategory(req.body);
  if (req.user) {
    const ctx = activityService.requestContext(req);
    await activityService.record({
      actorId: req.user._id,
      action: 'category.created',
      targetType: 'category',
      targetId: data._id,
      summary: `a créé la catégorie « ${data.name} »`,
      meta: { name: data.name },
      ...ctx,
    });
  }
  res.status(201).json(ApiResponse.created('Catégorie créée', data));
});

const updateCategory = catchAsync(async (req, res) => {
  const data = await categoryService.updateCategory(req.params.id, req.body);
  if (req.user) {
    const ctx = activityService.requestContext(req);
    await activityService.record({
      actorId: req.user._id,
      action: 'category.updated',
      targetType: 'category',
      targetId: data._id,
      summary: `a modifié la catégorie « ${data.name} »`,
      meta: { name: data.name, fields: Object.keys(req.body || {}) },
      ...ctx,
    });
  }
  res.json(ApiResponse.ok('Catégorie mise à jour', data));
});

const deleteCategory = catchAsync(async (req, res) => {
  const data = await categoryService.deleteCategory(req.params.id);
  if (req.user) {
    const ctx = activityService.requestContext(req);
    await activityService.record({
      actorId: req.user._id,
      action: 'category.deleted',
      targetType: 'category',
      targetId: req.params.id,
      summary: `a supprimé une catégorie${data?.name ? ` « ${data.name} »` : ''}`,
      meta: data ? { name: data.name } : {},
      ...ctx,
    });
  }
  res.json(ApiResponse.ok('Catégorie supprimée'));
});

const createTrade = catchAsync(async (req, res) => {
  const data = await categoryService.createTrade({
    name: req.body.name,
    categoryId: req.body.categoryId,
    description: req.body.description,
    icon: req.body.icon,
    image: req.body.image,
  });
  if (req.user) {
    const ctx = activityService.requestContext(req);
    await activityService.record({
      actorId: req.user._id,
      action: 'trade.created',
      targetType: 'trade',
      targetId: data._id,
      summary: `a créé le métier « ${data.name} »`,
      meta: { name: data.name, categoryId: req.body.categoryId },
      ...ctx,
    });
  }
  res.status(201).json(ApiResponse.created('Métier créé', data));
});

const updateTrade = catchAsync(async (req, res) => {
  const data = await categoryService.updateTrade(req.params.id, req.body);
  if (req.user) {
    const ctx = activityService.requestContext(req);
    await activityService.record({
      actorId: req.user._id,
      action: 'trade.updated',
      targetType: 'trade',
      targetId: data._id,
      summary: `a modifié le métier « ${data.name} »`,
      meta: { name: data.name, fields: Object.keys(req.body || {}) },
      ...ctx,
    });
  }
  res.json(ApiResponse.ok('Métier mis à jour', data));
});

const deleteTrade = catchAsync(async (req, res) => {
  const data = await categoryService.deleteTrade(req.params.id);
  if (req.user) {
    const ctx = activityService.requestContext(req);
    await activityService.record({
      actorId: req.user._id,
      action: 'trade.deleted',
      targetType: 'trade',
      targetId: req.params.id,
      summary: `a supprimé un métier${data?.name ? ` « ${data.name} »` : ''}`,
      meta: data ? { name: data.name } : {},
      ...ctx,
    });
  }
  res.json(ApiResponse.ok('Métier supprimé'));
});

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
