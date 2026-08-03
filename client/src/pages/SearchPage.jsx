import { useEffect, useState } from 'react';
import { SearchX, SlidersHorizontal } from 'lucide-react';
import { useSearchArtisansQuery } from '../features/artisans/artisans.api';
import {
  useListCategoriesQuery,
  useListDepartmentsQuery,
  useListTradesQuery,
} from '../features/catalog/catalog.api';
import { useListParams } from '../lib/useListParams';
import ArtisanCard from '../components/ArtisanCard';
import { Alert, Button, Container, EmptyState, Input, Loading, Select } from '../components/ui';
import { cleanParams, errorMessage } from '../lib/format';

function Filters({ filters, update }) {
  const { data: categories } = useListCategoriesQuery();
  const { data: departments } = useListDepartmentsQuery();
  // Les métiers ne sont chargés qu'une fois une catégorie choisie
  const { data: trades } = useListTradesQuery(
    { categoryId: filters.category },
    { skip: !filters.category }
  );

  const communes =
    (departments ?? []).find((d) => d.department === filters.department)?.communes ?? [];

  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Recherche</span>
        <Input
          defaultValue={filters.q}
          onBlur={(event) => update({ q: event.target.value.trim() })}
          onKeyDown={(event) => event.key === 'Enter' && update({ q: event.target.value.trim() })}
          placeholder="Métier, compétence…"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Catégorie</span>
        <Select
          value={filters.category}
          // Changer de catégorie invalide le métier sélectionné
          onChange={(event) => update({ category: event.target.value, trade: '' })}
        >
          <option value="">Toutes les catégories</option>
          {(categories ?? []).map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </Select>
      </label>

      {filters.category && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Métier</span>
          <Select value={filters.trade} onChange={(event) => update({ trade: event.target.value })}>
            <option value="">Tous les métiers</option>
            {(trades?.items ?? []).map((trade) => (
              <option key={trade._id} value={trade._id}>
                {trade.name}
              </option>
            ))}
          </Select>
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Département</span>
        <Select
          value={filters.department}
          onChange={(event) => update({ department: event.target.value, commune: '' })}
        >
          <option value="">Tout le Bénin</option>
          {(departments ?? []).map((entry) => (
            <option key={entry.department} value={entry.department}>
              {entry.department}
            </option>
          ))}
        </Select>
      </label>

      {communes.length > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Commune</span>
          <Select value={filters.commune} onChange={(event) => update({ commune: event.target.value })}>
            <option value="">Toutes les communes</option>
            {communes.map((commune) => (
              <option key={commune} value={commune}>
                {commune}
              </option>
            ))}
          </Select>
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Note minimale</span>
        <Select value={filters.minRating} onChange={(event) => update({ minRating: event.target.value })}>
          <option value="">Toutes les notes</option>
          <option value="4">4 étoiles et plus</option>
          <option value="3">3 étoiles et plus</option>
        </Select>
      </label>

      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={filters.isAvailable === 'true'}
          onChange={(event) => update({ isAvailable: event.target.checked ? 'true' : '' })}
          className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
        />
        <span className="text-sm text-slate-700">Disponible actuellement</span>
      </label>
    </div>
  );
}

export default function SearchPage() {
  const { filters, page, update, setPage } = useListParams({
    q: '',
    category: '',
    trade: '',
    department: '',
    commune: '',
    minRating: '',
    isAvailable: '',
    sort: 'rating',
  });

  const { data, isLoading, isFetching, isError, error } = useSearchArtisansQuery(
    cleanParams({ ...filters, page })
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  // Ferme le tiroir de filtres quand on passe en écran large
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const close = () => media.matches && setDrawerOpen(false);
    media.addEventListener('change', close);
    return () => media.removeEventListener('change', close);
  }, []);

  const artisans = data?.items ?? [];

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trouver un artisan</h1>
          {data && (
            <p className="mt-1 text-slate-600">
              {data.totalItems} artisan{data.totalItems > 1 ? 's' : ''} correspondant
              {data.totalItems > 1 ? 's' : ''} à votre recherche
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filtres
          </Button>
          <Select
            value={filters.sort}
            onChange={(event) => update({ sort: event.target.value })}
            aria-label="Trier les résultats"
            className="w-auto py-2 text-sm"
          >
            <option value="rating">Mieux notés</option>
            <option value="price">Prix croissant</option>
            <option value="newest">Plus récents</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <Filters filters={filters} update={update} />
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Filtres</h2>
                <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>
                  Fermer
                </Button>
              </div>
              <Filters filters={filters} update={update} />
              <Button className="mt-6 w-full" onClick={() => setDrawerOpen(false)}>
                Voir les résultats
              </Button>
            </div>
          </div>
        )}

        <div>
          {isLoading ? (
            <Loading label="Recherche en cours…" />
          ) : isError ? (
            <Alert>{errorMessage(error)}</Alert>
          ) : artisans.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Aucun artisan trouvé"
              description="Essayez d'élargir votre zone géographique ou de retirer certains filtres."
            />
          ) : (
            <>
              <div className={`grid gap-4 ${isFetching ? 'opacity-60' : ''}`}>
                {artisans.map((artisan) => (
                  <ArtisanCard key={artisan._id} artisan={artisan} />
                ))}
              </div>

              {data.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setPage(page - 1)}
                    disabled={!data.hasPrevPage}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {data.page} sur {data.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(page + 1)}
                    disabled={!data.hasNextPage}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
