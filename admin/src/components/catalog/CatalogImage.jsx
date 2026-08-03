import { useState } from 'react';
import { getCategoryIcon } from '../../lib/catalogIcons';
import { mediaUrl } from '../../lib/media';

const VARIANTS = {
  sm: { box: 'size-12 rounded-xl', icon: 'size-6' }, // 48 × 48
  lg: { box: 'size-16 rounded-2xl', icon: 'size-8' }, // 64 × 64
};

const TONES = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/10',
  slate: 'bg-slate-50 text-slate-500 ring-slate-100',
};

/**
 * Visuel d'une entité du catalogue (catégorie ou métier) : image si
 * disponible, sinon icône Lucide. En cas d'échec de chargement de l'image,
 * le repli sur l'icône est automatique (jamais de carré vide).
 */
export default function CatalogImage({
  image,
  icon,
  variant = 'sm',
  tone = 'brand',
  className = '',
}) {
  const [failed, setFailed] = useState(false);
  const { box, icon: iconSize } = VARIANTS[variant] ?? VARIANTS.sm;

  if (!image || failed) {
    const Icon = getCategoryIcon(icon);
    return (
      <span
        className={`flex shrink-0 items-center justify-center ring-1 ring-inset ${box} ${TONES[tone] ?? TONES.brand} ${className}`}
        aria-hidden="true"
      >
        <Icon className={iconSize} strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <img
      src={mediaUrl(image)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 object-cover ring-1 ring-inset ring-slate-200 ${box} ${className}`}
      aria-hidden="true"
    />
  );
}
