import { memo, useMemo, useState } from 'react';
import { Search, Tags } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorState, Input, Spinner } from '../ui';
import { errorMessage, formatNumber } from '../../lib/format';
import SectionTitle from './SectionTitle';
import CatalogImage from './CatalogImage';

function CategoryList({ categories, isLoading, isError, error, onRetry, selectedId, onSelect }) {
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        (category.slug ?? '').toLowerCase().includes(query)
    );
  }, [categories, search]);

  return (
    <Card className="h-fit overflow-hidden">
      <div className="border-b border-slate-100 px-7 pb-5 pt-7">
        <SectionTitle title="Catégories" />
      </div>

      <div className="px-7 pt-6">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une catégorie..."
            aria-label="Rechercher une catégorie"
            className="pl-10"
          />
        </div>
      </div>

      <div className="p-7 pt-5">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={onRetry} />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Catalogue vide"
            description="Commencez par créer une catégorie avec le bouton ci-dessus."
          />
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucun résultat"
            description="Aucune catégorie ne correspond à votre recherche."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {filteredCategories.map((category) => {
              const isSelected = category._id === selectedId;
              return (
                <li key={category._id}>
                  <button
                    type="button"
                    onClick={() => onSelect(category._id)}
                    aria-pressed={isSelected}
                    className={`group flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
                      isSelected
                        ? 'border-brand-500/50 bg-brand-50 shadow-[0_2px_12px_rgba(5,150,105,0.12)]'
                        : 'border-slate-200 bg-white hover:border-brand-200 hover:shadow-sm'
                    }`}
                  >
                    <CatalogImage
                      image={category.image}
                      icon={category.icon}
                      variant="sm"
                      tone={isSelected ? 'brand' : 'slate'}
                      className={
                        isSelected
                          ? ''
                          : 'transition-colors duration-200 ease-out group-hover:bg-slate-100'
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {category.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">{category.slug}</span>
                    </span>
                    <Badge tone={category.isActive === false ? 'slate' : 'green'}>
                      {formatNumber(category.tradeCount ?? 0)}
                    </Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

export default memo(CategoryList);
