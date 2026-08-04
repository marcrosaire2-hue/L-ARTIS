/**
 * Clés d'icônes catalogue (alignées sur l'admin) → MaterialCommunityIcons.
 * Les images uploadées (Cloudinary) restent prioritaires via CatalogVisual.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ICON_BY_KEY = {
  hammer: 'hammer',
  wrench: 'wrench',
  paintbrush: 'brush',
  'paint-roller': 'roller',
  'paintbrush-roller': 'roller',
  scissors: 'content-cut',
  drill: 'drill',
  toolbox: 'toolbox',
  briefcase: 'briefcase',
  'briefcase-business': 'briefcase',
  cog: 'cog',
  gear: 'cog',
  ruler: 'ruler',
  'pen-tool': 'pencil-ruler',
  sparkles: 'shimmer',
  layers: 'layers',
  'brick-wall': 'wall',
  shirt: 'tshirt-crew',
  truck: 'truck',
  bolt: 'flash',
  droplets: 'water',
  utensils: 'silverware-fork-knife',
  plane: 'airplane',
  'washing-machine': 'washing-machine',
  lamp: 'lamp',
  'tree-pine': 'pine-tree',
  bike: 'bicycle',
  folder: 'folder',
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

/** Nom MaterialCommunityIcons pour une clé / emoji catalogue. */
export function getCatalogIconName(value) {
  if (!value) return 'wrench';
  const trimmed = String(value).trim();
  const key = (EMOJI_TO_KEY[trimmed] ?? trimmed).toLowerCase();
  return ICON_BY_KEY[key] ?? 'wrench';
}

export { MaterialCommunityIcons };
