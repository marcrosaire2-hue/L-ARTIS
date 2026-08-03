/**
 * Normalisation et validation des numéros de téléphone (format E.164).
 *
 * Le numéro sert d'identifiant de connexion : il lui faut une forme canonique
 * unique. Un même abonné saisira selon les jours « 01 47 88 01 43 »,
 * « +229 01 47 88 01 43 » ou « 0022901 47 88 01 43 » ; sans normalisation à
 * l'enregistrement ET à la recherche, on créerait plusieurs comptes pour la
 * même personne et la connexion échouerait la plupart du temps.
 *
 * Format béninois : depuis la renumérotation de 2020, les numéros comptent
 * 10 chiffres et commencent par « 01 ». Le « 01 » fait partie du numéro (ce
 * n'est pas un préfixe interurbain à retirer, contrairement au « 0 » français),
 * si bien que la forme internationale est +229 suivi des 10 chiffres.
 * Les anciens numéros à 8 chiffres ne sont plus attribués : ils sont refusés.
 */
const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '229';

const BENIN_CODE = '229';
const BENIN_NATIONAL = /^01\d{8}$/;

function normalizePhone(value) {
  if (!value) return '';

  const raw = String(value).trim();
  const hadPlus = raw.startsWith('+');
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (!hadPlus) {
    // Préfixe international composé « 00 » : l'indicatif suit déjà
    if (digits.startsWith('00')) {
      digits = digits.slice(2);
    } else if (!digits.startsWith(DEFAULT_COUNTRY_CODE)) {
      // Numéro national : on ajoute l'indicatif du pays par défaut
      digits = `${DEFAULT_COUNTRY_CODE}${digits}`;
    }
  }

  return `+${digits}`;
}

/**
 * Valide un numéro normalisé.
 * Les numéros béninois sont contrôlés strictement (10 chiffres, préfixe 01) ;
 * un numéro étranger explicitement indicatif compris reste accepté sur la
 * seule forme générale E.164, faute de connaître tous les plans nationaux.
 */
function isValidPhone(value) {
  const normalized = normalizePhone(value);
  if (!/^\+\d{8,15}$/.test(normalized)) return false;

  if (normalized.startsWith(`+${BENIN_CODE}`)) {
    return BENIN_NATIONAL.test(normalized.slice(BENIN_CODE.length + 1));
  }
  return true;
}

/** Mise en forme lisible : +229 01 47 88 01 43 */
function formatPhone(value) {
  const normalized = normalizePhone(value);
  if (!normalized.startsWith(`+${BENIN_CODE}`)) return normalized;

  const national = normalized.slice(BENIN_CODE.length + 1);
  return `+${BENIN_CODE} ${national.replace(/(\d{2})(?=\d)/g, '$1 ')}`.trim();
}

/** Distingue un identifiant saisi : e-mail ou téléphone. */
function looksLikeEmail(value) {
  return typeof value === 'string' && value.includes('@');
}

module.exports = {
  normalizePhone,
  isValidPhone,
  formatPhone,
  looksLikeEmail,
  DEFAULT_COUNTRY_CODE,
  BENIN_NATIONAL,
};
