/**
 * Jetons de style partagés.
 *
 * React Native n'a ni CSS ni Tailwind : les classes du site web n'ont aucun
 * équivalent ici. On centralise donc couleurs, espacements et typographie
 * pour éviter que chaque écran ne réinvente les siens.
 */
export const colors = {
  brand: '#059669',
  brandDark: '#047857',
  brandLight: '#d1fae5',
  brandSurface: '#ecfdf5',
  accent: '#f59e0b',
  whatsapp: '#25D366',

  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',

  background: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',

  danger: '#dc2626',
  dangerSurface: '#fef2f2',
  success: '#059669',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };

export const typography = {
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  heading: { fontSize: 20, fontWeight: '600', color: colors.text },
  body: { fontSize: 16, color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  small: { fontSize: 13, color: colors.textLight },
};

/**
 * Hauteur minimale des zones tactiles. 44 points est le seuil au-dessous
 * duquel une cible devient difficile à atteindre au pouce — critique ici,
 * l'artisan manipulant souvent le téléphone d'une seule main sur un chantier.
 */
export const TOUCH_TARGET = 48;
