/**
 * Contrôleur géographie — référentiel public du Bénin.
 */
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const locationService = require('../services/location.service');

const listDepartments = catchAsync(async (req, res) => {
  const data = await locationService.listDepartments();
  res.json(ApiResponse.ok('Départements récupérés', data));
});

const listDistricts = catchAsync(async (req, res) => {
  const data = await locationService.listDistricts(req.query.commune);
  res.json(ApiResponse.ok('Quartiers récupérés', data));
});

module.exports = { listDepartments, listDistricts };
