/** Libellés et formats partagés (marché béninois : XOF, français). */

const priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export const PRICE_UNITS = {
  heure: 'de l’heure',
  jour: 'par jour',
  forfait: 'au forfait',
  projet: 'par projet',
};

export function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return priceFormatter.format(Number(value));
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

/** « il y a 3 jours » — plus parlant qu'une date sur un fil d'avis. */
export function timeAgo(value) {
  if (!value) return '';
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  const steps = [
    [31536000, 'an', 'ans'],
    [2592000, 'mois', 'mois'],
    [604800, 'semaine', 'semaines'],
    [86400, 'jour', 'jours'],
    [3600, 'heure', 'heures'],
    [60, 'minute', 'minutes'],
  ];
  for (const [span, singular, plural] of steps) {
    const count = Math.floor(seconds / span);
    if (count >= 1) return `il y a ${count} ${count > 1 ? plural : singular}`;
  }
  return "à l'instant";
}

export function fullName(user) {
  if (!user) return '—';
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
}

export function initials(value) {
  if (!value) return '?';
  const source = typeof value === 'string' ? value : fullName(value);
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

/** Chemin absolu d'un média servi par l'API (`/uploads/...`). */
export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const api =
    (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(
      'https://lartis-api.onrender.com',
      'https://lartis-api-sc17.onrender.com'
    );
  const base = api.replace(/\/api\/v\d+$/, '');
  return `${base}${path}`;
}

/** Message lisible depuis une erreur RTK Query. */
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
    return "Impossible de joindre le serveur. Vérifiez votre connexion.";
  }
  return fallback;
}

export function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null)
  );
}

/*
 * Téléphone béninois : depuis la renumérotation de 2020, 10 chiffres
 * commençant par « 01 ». Le « 01 » fait partie du numéro, ce n'est pas un
 * préfixe interurbain à retirer. Le serveur refait la normalisation de son
 * côté ; cette validation-ci sert uniquement à guider la saisie.
 */
export const BENIN_PHONE_HINT = 'Format béninois : 10 chiffres commençant par 01 (ex. 01 47 88 01 43)';

export function isBeninPhone(value) {
  if (!value) return false;
  let digits = String(value).replace(/\D/g, '');
  if (digits.startsWith('00229')) digits = digits.slice(5);
  else if (digits.startsWith('229')) digits = digits.slice(3);
  return /^01\d{8}$/.test(digits);
}

export function formatPhone(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  const national = digits.startsWith('229') ? digits.slice(3) : digits;
  return national.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}
