import { Link } from 'react-router-dom';
import { BadgeCheck, MapPin } from 'lucide-react';
import { Badge, Rating } from './ui';
import { PRICE_UNITS, formatPrice, initials, mediaUrl } from '../lib/format';

export default function ArtisanCard({ artisan }) {
  const photo = mediaUrl(artisan.profilePhoto);
  const trades = artisan.trades ?? [];
  const commune = artisan.location?.commune;

  return (
    <Link
      to={`/artisans/${artisan.artisanId}`}
      className="group flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition-shadow hover:shadow-md"
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          className="size-20 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xl font-semibold text-brand-800">
          {initials(artisan.displayName)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-700">
            {artisan.displayName}
            {artisan.isVerified && (
              <BadgeCheck className="ml-1 inline size-4 text-brand-600" aria-label="Profil vérifié" />
            )}
          </h3>
          {artisan.availability?.isAvailable === false && (
            <Badge tone="slate">Indisponible</Badge>
          )}
        </div>

        {artisan.tagline && (
          <p className="mt-0.5 truncate text-sm text-slate-500">{artisan.tagline}</p>
        )}

        {trades.length > 0 && (
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {trades.slice(0, 3).map((trade) => (
              <Badge key={trade.id ?? trade._id ?? trade.name} tone="green">
                {trade.name}
              </Badge>
            ))}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Rating value={artisan.rating?.average ?? 0} count={artisan.rating?.count ?? 0} />
          {commune && (
            <span className="flex items-center gap-1 text-slate-500">
              <MapPin className="size-4" aria-hidden="true" />
              {commune}
            </span>
          )}
          {artisan.pricing?.fromPrice > 0 && (
            <span className="text-slate-700">
              dès <strong>{formatPrice(artisan.pricing.fromPrice)}</strong>{' '}
              {PRICE_UNITS[artisan.pricing.unit] ?? ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
