import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Search, ShieldCheck, Sparkles, Tags } from 'lucide-react';
import { useListCategoriesQuery, useListDepartmentsQuery } from '../features/catalog/catalog.api';
import { useSearchArtisansQuery } from '../features/artisans/artisans.api';
import ArtisanCard from '../components/ArtisanCard';
import { Button, Container, EmptyState, Input, Select, Spinner } from '../components/ui';

function HeroSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [commune, setCommune] = useState('');
  const { data: departments } = useListDepartmentsQuery();

  const communes = (departments ?? []).flatMap((d) => d.communes);

  const onSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (commune) params.set('commune', commune);
    navigate(`/recherche?${params}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-slate-200 sm:flex-row"
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Plombier, couturier, mécanicien…"
          aria-label="Métier ou compétence recherchée"
          className="border-0 pl-12 ring-0 focus:ring-0"
        />
      </div>
      <div className="relative sm:w-56">
        <MapPin
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Select
          value={commune}
          onChange={(event) => setCommune(event.target.value)}
          aria-label="Commune"
          className="border-0 pl-12 ring-0 focus:ring-0"
        >
          <option value="">Toute commune</option>
          {communes.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="lg" className="sm:w-auto">
        Rechercher
      </Button>
    </form>
  );
}

function Hero() {
  return (
    <section className="bg-gradient-to-b from-brand-50 to-white py-12 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Trouvez un artisan de confiance près de chez vous
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Maçons, électriciens, couturiers, mécaniciens : des professionnels vérifiés
            partout au Bénin, avec des tarifs annoncés en FCFA.
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <HeroSearch />
        </div>
      </Container>
    </section>
  );
}

function Categories() {
  const { data, isLoading } = useListCategoriesQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <EmptyState
        icon={Tags}
        title="Le catalogue est en cours de préparation"
        description="Les catégories de métiers seront bientôt disponibles."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {data.map((category) => (
        <Link
          key={category._id}
          to={`/recherche?category=${category._id}`}
          className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition-shadow hover:shadow-md"
        >
          <span className="text-2xl" aria-hidden="true">
            {category.icon || '🛠️'}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-slate-900">{category.name}</span>
            {category.tradeCount > 0 && (
              <span className="block text-xs text-slate-500">{category.tradeCount} métiers</span>
            )}
          </span>
        </Link>
      ))}
    </div>
  );
}

function FeaturedArtisans() {
  const { data, isLoading } = useSearchArtisansQuery({ sort: 'rating', limit: 6 });
  const artisans = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (artisans.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Les premiers artisans arrivent bientôt"
        description="Vous êtes artisan ? Créez votre fiche dès maintenant et soyez parmi les premiers visibles."
        action={
          <Link to="/inscription?role=artisan" className="mt-2">
            <Button>Créer ma fiche artisan</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {artisans.map((artisan) => (
        <ArtisanCard key={artisan._id} artisan={artisan} />
      ))}
    </div>
  );
}

function SectionHeader({ title, description, to, linkLabel }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-slate-600">{description}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          {linkLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />

      <Container className="py-12">
        <SectionHeader
          title="Explorer par métier"
          description="Choisissez une catégorie pour découvrir les artisans disponibles."
        />
        <Categories />
      </Container>

      <Container className="py-4">
        <SectionHeader
          title="Artisans les mieux notés"
          to="/recherche"
          linkLabel="Voir tous les artisans"
        />
        <FeaturedArtisans />
      </Container>

      <Container className="py-12">
        <div className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 sm:px-12">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-600/20 px-3 py-1 text-sm font-medium text-brand-300">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Inscription gratuite
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
              Vous êtes artisan ? Faites-vous connaître.
            </h2>
            <p className="mt-3 text-slate-300">
              Créez votre fiche en moins d'une minute, recevez des demandes de devis de clients
              proches de vous, et développez votre activité.
            </p>
            <Link to="/inscription?role=artisan" className="mt-6 inline-block">
              <Button variant="accent" size="lg">
                Créer ma fiche artisan
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
