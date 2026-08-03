import {
  Bike,
  Bolt,
  BrickWall,
  BriefcaseBusiness,
  Cog,
  Droplets,
  Drill,
  FolderOpen,
  Hammer,
  Lamp,
  Layers,
  Paintbrush,
  PaintRoller,
  PenTool,
  Plane,
  Ruler,
  Scissors,
  Shirt,
  Sparkles,
  Toolbox,
  TreePine,
  Truck,
  Utensils,
  WashingMachine,
  Wrench,
} from 'lucide-react';

/*
 * Système d'icônes du catalogue.
 * Les fiches stockent une clé d'icône (ex. "hammer", "wrench") ; le mapping
 * ci-dessous la traduit en composant Lucide. Les emojis encore présents dans
 * d'anciennes fiches sont convertis transitoirement vers leur équivalent
 * (aucun emoji n'est rendu à l'écran). Clé inconnue ou absente → icône neutre.
 */

const ICON_BY_KEY = {
  hammer: Hammer,
  wrench: Wrench,
  paintbrush: Paintbrush,
  'paint-roller': PaintRoller,
  'paintbrush-roller': PaintRoller,
  scissors: Scissors,
  drill: Drill,
  toolbox: Toolbox,
  briefcase: BriefcaseBusiness,
  'briefcase-business': BriefcaseBusiness,
  cog: Cog,
  gear: Cog,
  ruler: Ruler,
  'pen-tool': PenTool,
  sparkles: Sparkles,
  layers: Layers,
  'brick-wall': BrickWall,
  shirt: Shirt,
  truck: Truck,
  bolt: Bolt,
  droplets: Droplets,
  utensils: Utensils,
  plane: Plane,
  'washing-machine': WashingMachine,
  lamp: Lamp,
  'tree-pine': TreePine,
  bike: Bike,
  folder: FolderOpen,
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

export function getCategoryIcon(value) {
  if (!value) return Wrench;
  const normalized = (EMOJI_TO_KEY[value.trim()] ?? value).trim().toLowerCase();
  return ICON_BY_KEY[normalized] ?? Wrench;
}

/** Rendu d'une icône de fiche (catégorie ou métier) dans le carré coloré. */
export default function CategoryIcon({ value, className = 'size-5' }) {
  const Icon = getCategoryIcon(value);
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
