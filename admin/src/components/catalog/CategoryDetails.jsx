import { memo } from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ErrorState, Spinner } from '../ui';
import { errorMessage, formatNumber } from '../../lib/format';
import SectionTitle from './SectionTitle';
import TradeCard from './TradeCard';
import CatalogImage from './CatalogImage';

function CategoryDetails({
  selected,
  trades,
  onEditCategory,
  onDeleteCategory,
  onAddTrade,
  onEditTrade,
  onDeleteTrade,
}) {
  if (!selected) {
    return (
      <Card className="overflow-hidden">
        <EmptyState
          icon={Tags}
          title="Aucune catégorie sélectionnée"
          description="Choisissez une catégorie pour gérer ses métiers."
        />
      </Card>
    );
  }

  const tradeItems = trades.data?.items ?? [];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-7 sm:p-8">
        <div className="flex min-w-0 items-start gap-4">
          <CatalogImage image={selected.image} icon={selected.icon} variant="lg" tone="brand" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                {selected.name}
              </h2>
              <Badge tone={selected.isActive === false ? 'slate' : 'green'}>
                {formatNumber(selected.tradeCount ?? 0)} métier
                {selected.tradeCount > 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
              {selected.description || 'Aucune description renseignée.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" onClick={() => onEditCategory(selected)}>
            <Pencil className="size-3.5" aria-hidden="true" />
            Modifier
          </Button>
          <Button
            variant="ghost"
            className="hover:bg-red-50 hover:text-red-600"
            onClick={() => onDeleteCategory(selected)}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Supprimer
          </Button>
          <Button onClick={onAddTrade} className="shadow-md shadow-brand-600/20">
            <Plus className="size-4" aria-hidden="true" />
            Ajouter un métier
          </Button>
        </div>
      </div>

      <div className="p-7 sm:p-8">
        <div className="mb-5">
          <SectionTitle
            title="Métiers"
            count={
              !trades.isLoading && !trades.isError && tradeItems.length > 0
                ? `${formatNumber(tradeItems.length)} métier${tradeItems.length > 1 ? 's' : ''}`
                : undefined
            }
          />
        </div>

        {trades.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : trades.isError ? (
          <ErrorState message={errorMessage(trades.error)} onRetry={trades.refetch} />
        ) : tradeItems.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Aucun métier"
            description="Ajoutez le premier métier de cette catégorie."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {tradeItems.map((trade) => (
              <li key={trade._id}>
                <TradeCard trade={trade} onEdit={onEditTrade} onDelete={onDeleteTrade} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export default memo(CategoryDetails);
