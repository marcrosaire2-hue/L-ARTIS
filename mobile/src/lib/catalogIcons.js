/**
 * Clés d'icônes catalogue (alignées sur l'admin) → glyphes de secours.
 * Les images uploadées (Cloudinary) restent prioritaires via CatalogVisual.
 */

const GLYPH_BY_KEY = {
  hammer: '🔨',
  wrench: '🔧',
  paintbrush: '🖌️',
  'paint-roller': '🎨',
  'paintbrush-roller': '🎨',
  scissors: '✂️',
  drill: '🪛',
  toolbox: '🧰',
  briefcase: '💼',
  'briefcase-business': '💼',
  cog: '⚙️',
  gear: '⚙️',
  ruler: '📏',
  'pen-tool': '🖊️',
  sparkles: '✨',
  layers: '📚',
  'brick-wall': '🧱',
  shirt: '👕',
  truck: '🚚',
  bolt: '⚡',
  droplets: '💧',
  utensils: '🍽️',
  plane: '✈️',
  'washing-machine': '🧺',
  lamp: '💡',
  'tree-pine': '🌳',
  bike: '🚲',
  folder: '📁',
};

const EMOJI_TO_KEY = {
  '🔨': 'hammer',
  '🪚': 'wrench',
  '🧱': 'brick-wall',
  '🧰': 'toolbox',
  '🛠️': 'wrench',
  '🪛': 'wrench',
  '🎨': 'paintbrush',
  '🖌️': 'paintbrush',
  '🖊️': 'pen-tool',
  '✂️': 'scissors',
  '💼': 'briefcase',
  '⚙️': 'cog',
  '📏': 'ruler',
  '✨': 'sparkles',
  '📚': 'layers',
  '👕': 'shirt',
  '🚚': 'truck',
  '⚡': 'bolt',
  '💧': 'droplets',
  '🍽️': 'utensils',
  '✈️': 'plane',
  '🧺': 'washing-machine',
  '💡': 'lamp',
  '🌳': 'tree-pine',
  '🚲': 'bike',
  '📁': 'folder',
};

/** True si la valeur ressemble à un emoji (anciennes fiches). */
export function isEmojiIcon(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && !/^[a-z0-9-]+$/i.test(trimmed);
}

/** Glyphe de secours pour une clé / emoji catalogue. */
export function getCatalogGlyph(value) {
  if (!value) return '🔧';
  const trimmed = String(value).trim();
  if (isEmojiIcon(trimmed)) return trimmed;
  const key = (EMOJI_TO_KEY[trimmed] ?? trimmed).toLowerCase();
  return GLYPH_BY_KEY[key] ?? '🔧';
}
