/**
 * Service signalements — création utilisateur + traitement admin.
 */
const { Report, Artisan, Review, Quote, Message, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { PAGINATION, REPORT_STATUS } = require('../constants');
const { notifyAdmins, notifyUser } = require('./notification.service');

const TARGET_REF = {
  artisan: 'Artisan',
  review: 'Review',
  quote: 'Quote',
  message: 'Message',
};

async function assertTargetExists(targetType, targetId) {
  const Model = { artisan: Artisan, review: Review, quote: Quote, message: Message }[targetType];
  if (!Model) throw new ApiError(400, 'Type de cible invalide');
  const exists = await Model.exists({ _id: targetId });
  if (!exists) throw new ApiError(404, 'Élément signalé introuvable');
}

async function createReport(reporterId, { targetType, targetId, reason, description }) {
  if (!TARGET_REF[targetType]) throw new ApiError(400, 'Type de cible invalide');
  await assertTargetExists(targetType, targetId);

  const report = await Report.create({
    reporter: reporterId,
    targetType,
    targetId,
    targetRef: TARGET_REF[targetType],
    reason,
    description: description || '',
  });

  await notifyAdmins(
    'report_new',
    'Nouveau signalement',
    `Un ${targetType} a été signalé (${reason})`,
    { reportId: String(report._id), targetType, targetId: String(targetId) }
  );

  return report;
}

async function listReports({ status, page = 1, limit = PAGINATION.DEFAULT_LIMIT }) {
  const filters = {};
  if (status) filters.status = status;
  return Report.paginate({
    page,
    limit,
    filters,
    sort: { createdAt: -1 },
    populate: [
      { path: 'reporter', select: 'firstName lastName email phone role' },
      { path: 'handledBy', select: 'firstName lastName' },
    ],
  });
}

async function handleReport(reportId, adminUserId, { status, resolutionNote }) {
  if (![REPORT_STATUS.REVIEWED, REPORT_STATUS.DISMISSED].includes(status)) {
    throw new ApiError(400, 'Statut de traitement invalide');
  }
  const report = await Report.findById(reportId);
  if (!report) throw new ApiError(404, 'Signalement introuvable');

  report.status = status;
  report.resolutionNote = resolutionNote || '';
  report.handledBy = adminUserId;
  report.handledAt = new Date();
  await report.save();

  await notifyUser(
    report.reporter,
    'system',
    'Signalement traité',
    status === REPORT_STATUS.REVIEWED
      ? 'Votre signalement a été examiné et pris en compte.'
      : 'Votre signalement a été examiné sans suite.',
    { reportId: String(report._id) }
  );

  return report;
}

module.exports = { createReport, listReports, handleReport };
