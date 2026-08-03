/**
 * Contrôleur catégories & métiers.
 */
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const categoryService = require('../services/category.service');

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
  res.status(201).json(ApiResponse.created('Catégorie créée', data));
});

const updateCategory = catchAsync(async (req, res) => {
  const data = await categoryService.updateCategory(req.params.id, req.body);
  res.json(ApiResponse.ok('Catégorie mise à jour', data));
});

const deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
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
  res.status(201).json(ApiResponse.created('Métier créé', data));
});

const updateTrade = catchAsync(async (req, res) => {
  const data = await categoryService.updateTrade(req.params.id, req.body);
  res.json(ApiResponse.ok('Métier mis à jour', data));
});

const deleteTrade = catchAsync(async (req, res) => {
  await categoryService.deleteTrade(req.params.id);
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
