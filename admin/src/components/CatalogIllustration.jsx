import { useState } from 'react';
import { Toolbox } from 'lucide-react';

/*
 * Illustration de bannière du catalogue.
 * Sources d'illustration testées dans l'ordre (webp puis png). Si aucune
 * n'existe, une icône Toolbox décorative est affichée. Ajouter une nouvelle
 * illustration revient à ajouter un chemin dans SOURCES.
 */
const SOURCES = ['/images/catalog/toolbox.webp', '/images/catalog/toolbox.png'];

export default function CatalogIllustration({ className = '' }) {
  const [cursor, setCursor] = useState(0);

  if (cursor >= SOURCES.length) {
    return <Toolbox className={className} strokeWidth={1.25} aria-hidden="true" />;
  }

  return (
    <img
      src={SOURCES[cursor]}
      alt=""
      className={className}
      aria-hidden="true"
      onError={() => setCursor((current) => current + 1)}
    />
  );
}
