import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useListFavoritesQuery } from '../features/favorites/favorites.api';
import ArtisanCard from '../components/ArtisanCard';
import { Container, EmptyState, Loading } from '../components/ui';

export default function FavoritesPage() {
  const { data, isLoading, isError } = useListFavoritesQuery();
  const items = data?.items ?? [];

  if (isLoading) return <Loading label="Chargement de vos favoris…" />;

  return (
    <Container className="py-10">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">Mes favoris</h1>
      <p className="mb-6 text-slate-600">Artisans que vous avez enregistrés pour les retrouver facilement.</p>

      {isError ? (
        <p className="text-slate-600">Impossible de charger vos favoris.</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Aucun favori"
          description="Ajoutez des artisans à vos favoris depuis leur fiche."
          action={
            <Link to="/recherche" className="mt-2 text-sm font-medium text-brand-700 hover:underline">
              Rechercher un artisan
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((entry) =>
            entry.artisan ? <ArtisanCard key={entry._id ?? entry.artisan._id} artisan={entry.artisan} /> : null
          )}
        </div>
      )}
    </Container>
  );
}
