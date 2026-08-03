import { ImageIcon } from 'lucide-react';
import { mediaUrl } from '../../lib/media';

/** Aperçu carré d'une image (URL serveur ou blob local en cours d'envoi). */
export default function ImagePreview({ image, className = 'size-20' }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-inset ring-slate-200 ${className}`}
    >
      {image ? (
        <img src={mediaUrl(image)} alt="" className="size-full object-cover" aria-hidden="true" />
      ) : (
        <ImageIcon className="size-7 text-slate-300" aria-hidden="true" />
      )}
    </div>
  );
}
