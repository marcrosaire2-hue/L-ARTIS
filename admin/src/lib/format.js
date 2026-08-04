/**
 * Libellés, formats et helpers partagés.
 * Les clés reflètent les énumérations de `server/src/constants/index.js`.
 */

export const ARTISAN_STATUS = {
  pending: { label: 'En attente', tone: 'green' },
  validated: { label: 'Publié', tone: 'green' },
  rejected: { label: 'Refusé', tone: 'red' },
  suspended: { label: 'Suspendu', tone: 'amber' },
};

export const ACCOUNT_STATUS = {
  active: { label: 'Actif', tone: 'green' },
  pending: { label: 'À vérifier', tone: 'amber' },
  suspended: { label: 'Suspendu', tone: 'red' },
  deleted: { label: 'Supprimé', tone: 'slate' },
};

export const REVIEW_STATUS = {
  pending: { label: 'À modérer', tone: 'amber' },
  approved: { label: 'Publié', tone: 'green' },
  hidden: { label: 'Masqué', tone: 'slate' },
};

export const REPORT_STATUS = {
  pending: { label: 'En attente', tone: 'amber' },
  reviewed: { label: 'Traité', tone: 'green' },
  dismissed: { label: 'Classé sans suite', tone: 'slate' },
};

export const REPORT_REASONS = {
  profil_frauduleux: 'Profil frauduleux',
  fausses_informations: 'Fausses informations',
  comportement_inapproprie: 'Comportement inapproprié',
  arnaque: 'Arnaque',
  spam: 'Spam',
  contenu_illicite: 'Contenu illicite',
  autre: 'Autre',
};

export const REPORT_TARGET_TYPES = {
  artisan: 'Artisan',
  review: 'Avis',
  quote: 'Devis',
  message: 'Message',
};

export const ROLES = {
  admin: { label: 'Administrateur', tone: 'purple' },
  artisan: { label: 'Artisan', tone: 'blue' },
  client: { label: 'Client', tone: 'slate' },
};

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('fr-FR').format(value ?? 0);
}

export function fullName(user) {
  if (!user) return '—';
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
}

export function initials(user) {
  if (!user) return '?';
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

/**
 * Extrait un message lisible d'une erreur RTK Query.
 * L'API renvoie { message, details? } ; `details` est un tableau de
 * { field, message } pour les erreurs de validation (422).
 */
export function errorMessage(error, fallback = 'Une erreur est survenue.') {
  if (!error) return fallback;
  const payload = error.data;

  if (payload?.details?.length) {
    return payload.details
      .map((detail) => (typeof detail === 'string' ? detail : detail.message))
      .join(' · ');
  }
  if (payload?.message) return payload.message;
  if (error.status === 'FETCH_ERROR') {
    return "Impossible de joindre l'API. Vérifiez que le serveur est démarré.";
  }
  return fallback;
}

/** Retire les paramètres vides avant de les envoyer en query string. */
export function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null)
  );
}
