import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge, Button } from '../ui';
import { formatNumber } from '../../lib/format';
import CatalogImage from './CatalogImage';

function TradeCard({ trade, onEdit, onDelete }) {
  return (
    <div className="group flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
      <CatalogImage image={trade.image} icon={trade.icon} variant="sm" tone="brand" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-base font-semibold text-slate-900">{trade.name}</p>
          <p className="truncate text-xs text-slate-400">{trade.slug}</p>
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {trade.description || '—'}
        </p>
      </div>
      <Badge tone="green" className="whitespace-nowrap">
        {formatNumber(trade.artisanCount ?? 0)} artisan{trade.artisanCount > 1 ? 's' : ''}
      </Badge>
      <div className="flex shrink-0 gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onEdit(trade)}
          aria-label={`Modifier le métier ${trade.name}`}
          title="Modifier"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="hover:bg-red-50 hover:text-red-600"
          onClick={() => onDelete(trade)}
          aria-label={`Supprimer le métier ${trade.name}`}
          title="Supprimer"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export default memo(TradeCard);
