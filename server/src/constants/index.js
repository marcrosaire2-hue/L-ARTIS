/**
 * Constantes globales du domaine (DRY) :
 * rôles, statuts métier, limites, expressions régulières.
 */
const ROLES = Object.freeze({
  ADMIN: 'admin',
  ARTISAN: 'artisan',
  CLIENT: 'client',
});

const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
  DELETED: 'deleted',
});

const ARTISAN_STATUS = Object.freeze({
  PENDING: 'pending',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
});

const QUOTE_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
});

const REVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  HIDDEN: 'hidden',
});

const REPORT_STATUS = Object.freeze({
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  DISMISSED: 'dismissed',
});

const MESSAGE_STATUS = Object.freeze({
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
});

const NOTIFICATION_TYPES = Object.freeze([
  'quote_new',
  'quote_status',
  'message_new',
  'review_new',
  'artisan_validated',
  'artisan_rejected',
  'report_new',
  'system',
]);

const MIME_TYPES = Object.freeze({
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
});

const REGEX = Object.freeze({
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  PHONE: /^\+?[0-9\s\-().]{8,20}$/,
  OBJECT_ID: /^[0-9a-fA-F]{24}$/,
});

const PAGINATION = Object.freeze({
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 50,
});

/** Version du règlement L-ARTIS (clients / artisans) — alignée côté front. */
const TERMS_VERSION = '2026-08-01';

module.exports = {
  ROLES,
  ACCOUNT_STATUS,
  ARTISAN_STATUS,
  QUOTE_STATUS,
  REVIEW_STATUS,
  REPORT_STATUS,
  MESSAGE_STATUS,
  NOTIFICATION_TYPES,
  MIME_TYPES,
  REGEX,
  PAGINATION,
  TERMS_VERSION,
};
