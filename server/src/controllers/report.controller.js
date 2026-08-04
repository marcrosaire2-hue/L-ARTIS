const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const reportService = require('../services/report.service');

const create = catchAsync(async (req, res) => {
  const data = await reportService.createReport(req.user._id, req.body);
  res.status(201).json(ApiResponse.created('Signalement enregistré', data));
});

const list = catchAsync(async (req, res) => {
  const data = await reportService.listReports(req.query);
  res.json(ApiResponse.ok('Signalements', data));
});

const handle = catchAsync(async (req, res) => {
  const data = await reportService.handleReport(req.params.id, req.user._id, req.body);
  res.json(ApiResponse.ok('Signalement traité', data));
});

module.exports = { create, list, handle };
