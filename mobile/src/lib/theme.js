/**
 * Jetons de style — langage Monpermis adapté à L-ARTIS.
 * Crème (splash), vert marque, navy d'autorité, feuille auth claire.
 */
export const colors = {
  brand: '#00B050',
  brandDark: '#008F40',
  brandBright: '#00D566',
  brandLight: '#d1fae5',
  brandSurface: '#ecfdf5',
  accent: '#F5B31B',
  whatsapp: '#25D366',

  navy: '#0B1F17',
  navyMuted: '#3d5a4a',

  cream: '#FAF9F6',
  panel: '#F4F7FB',

  text: '#0B1F17',
  textMuted: '#3d5a4a',
  textLight: '#7a9084',

  background: '#ffffff',
  surface: '#F8FAFC',
  border: 'rgba(11, 31, 23, 0.10)',

  danger: '#E85D3B',
  dangerSurface: '#fef2f2',
  success: '#00B050',
};

export const gradients = {
  green: ['#00D566', '#008F40'],
  heroVeil: ['rgba(11,31,23,0.35)', 'rgba(11,31,23,0.55)', 'rgba(11,31,23,0.92)'],
  authVeil: ['rgba(11,31,23,0.55)', 'rgba(11,31,23,0.82)', '#0B1F17'],
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 8, md: 14, lg: 20, xl: 28, full: 999 };

export const typography = {
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  heading: { fontSize: 20, fontWeight: '700', color: colors.text },
  body: { fontSize: 16, color: colors.text, lineHeight: 24 },
  muted: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  small: { fontSize: 13, color: colors.textLight, lineHeight: 18 },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.brand,
  },
};

export const TOUCH_TARGET = 52;
