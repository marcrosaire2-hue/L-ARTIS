/**
 * Journal d'activité administrateur — enregistre et consulte les effets
 * concrets des décisions prises dans le panneau d'admin.
 */
const { AdminActivity } = require('../models');
const { PAGINATION } = require('../constants');
const logger = require('../config/logger');

/**
 * Enregistre une activité. Ne doit jamais faire échouer l'action métier :
 * un échec de journalisation est seulement loggé.
 */
async function record({
  actorId,
  action,
  summary,
  targetType = 'system',
  targetId = null,
  meta = {},
  ip = '',
  userAgent = '',
}) {
  try {
    if (!actorId || !action || !summary) return null;
    return await AdminActivity.create({
      actor: actorId,
      action,
      summary: String(summary).slice(0, 500),
      targetType,
      targetId: targetId || undefined,
      meta,
      ip: String(ip || '').slice(0, 80),
      userAgent: String(userAgent || '').slice(0, 500),
    });
  } catch (error) {
    logger.warn(`Journal admin non enregistré (${action}) : ${error.message}`);
    return null;
  }
}

/** Extrait IP + user-agent depuis la requête Express. */
function requestContext(req) {
  if (!req) return { ip: '', userAgent: '' };
  return {
    ip: req.ip || req.headers['x-forwarded-for'] || '',
    userAgent: req.get?.('user-agent') || '',
  };
}

async function listActivities({
  actor,
  action,
  targetType,
  page = 1,
  limit = PAGINATION.DEFAULT_LIMIT,
} = {}) {
  const filters = {};
  if (actor) filters.actor = actor;
  if (action) filters.action = action;
  if (targetType) filters.targetType = targetType;

  return AdminActivity.paginate({
    page,
    limit,
    filters,
    sort: { createdAt: -1 },
    populate: [{ path: 'actor', select: 'firstName lastName email role' }],
  });
}

module.exports = {
  record,
  requestContext,
  listActivities,
};
