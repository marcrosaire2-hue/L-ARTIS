import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Hammer, Star, Tags, UserCheck, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useListArtisansQuery } from '../features/artisans/artisans.api';
import { useListUsersQuery } from '../features/users/users.api';
import { useListReviewsQuery } from '../features/reviews/reviews.api';
import { useListCategoriesQuery } from '../features/catalog/catalog.api';
import { selectUser } from '../features/auth/authSlice';
import { Badge, Card, EmptyState, Spinner, StatusBadge } from '../components/ui';
import { ARTISAN_STATUS, formatDate, formatNumber, fullName, initials } from '../lib/format';

// L'API ne propose pas encore d'endpoint d'agrégation : les compteurs sont
// lus via `totalItems`, avec limit=1 pour ne pas rapatrier les documents.
const COUNT_ONLY = { limit: 1 };

const TODAY = (() => {
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
})();

const SALUTATION = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir';

const TONES = {
  amber: {
    card: 'bg-gradient-to-br from-amber-50 via-white to-white hover:shadow-amber-200/50',
    icon: 'bg-gradient-to-br from-amber-100 to-amber-200/70 text-amber-700',
    decor: 'bg-amber-400',
  },
  brand: {
    card: 'bg-gradient-to-br from-brand-50 via-white to-white hover:shadow-brand-200/50',
    icon: 'bg-gradient-to-br from-brand-100 to-brand-200/70 text-brand-700',
    decor: 'bg-brand-400',
  },
  violet: {
    card: 'bg-gradient-to-br from-violet-50 via-white to-white hover:shadow-violet-200/50',
    icon: 'bg-gradient-to-br from-violet-100 to-violet-200/70 text-violet-700',
    decor: 'bg-violet-400',
  },
  blue: {
    card: 'bg-gradient-to-br from-sky-50 via-white to-white hover:shadow-sky-200/50',
    icon: 'bg-gradient-to-br from-sky-100 to-sky-200/70 text-sky-700',
    decor: 'bg-sky-400',
  },
  slate: {
    card: 'bg-gradient-to-br from-slate-50 via-white to-white hover:shadow-slate-200/50',
    icon: 'bg-gradient-to-br from-slate-100 to-slate-200/70 text-slate-600',
    decor: 'bg-slate-400',
  },
};

function StatCard({ icon: Icon, label, value, loading, to, tone = 'slate' }) {
  const t = TONES[tone] ?? TONES.slate;
  const body = (
    <Card
      className={`group relative overflow-hidden p-6 transition-all duration-base ease-out hover:-translate-y-1 hover:shadow-lg ${t.card}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -right-10 -top-10 size-36 rounded-full opacity-[0.07] ${t.decor}`}
      />
      <span
        className={`flex size-14 shrink-0 items-center justify-center rounded-panel shadow-sm ring-1 ring-inset ring-white/60 transition-transform duration-base group-hover:scale-105 ${t.icon}`}
      >
        <Icon className="size-6.5" aria-hidden="true" />
      </span>
      <div className="mt-5 min-w-0">
        {loading ? (
          <Spinner className="size-6" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(value)}
          </p>
        )}
        <p className="mt-1.5 text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  );

  return to ? (
    <Link
      to={to}
      className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      {body}
    </Link>
  ) : (
    body
  );
}

function PanelHeader({ icon: Icon, title, count, to }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-panel bg-gradient-to-br from-brand-100 to-brand-50 text-brand-700">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <h2 className="truncate text-sm font-semibold text-slate-900">{title}</h2>
        {count > 0 && <Badge tone="amber">{formatNumber(count)}</Badge>}
      </div>
      <Link
        to={to}
        className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand-700 transition-colors duration-base hover:bg-brand-50 hover:text-brand-800"
      >
        Tout voir
        <ArrowRight
          className="size-4 transition-transform duration-base group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}

function DashboardHeader() {
  const user = useSelector(selectUser);
  return (
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          Espace administration
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {SALUTATION}, {user?.firstName ?? 'Administrateur'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Vue d'ensemble de la plateforme et files d'attente de modération.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-panel bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
          <CalendarDays className="size-4 text-brand-600" aria-hidden="true" />
          {TODAY}
        </span>
        <span className="hidden items-center gap-2.5 rounded-panel bg-white py-1.5 pl-1.5 pr-4 shadow-sm ring-1 ring-slate-200 sm:inline-flex">
          <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white ring-2 ring-brand-100">
            {initials(user)}
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-slate-900">{fullName(user)}</span>
            <span className="block text-xs text-slate-500">{user?.email}</span>
          </span>
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const artisansTotal = useListArtisansQuery(COUNT_ONLY);
  const artisansPending = useListArtisansQuery({ status: 'pending', limit: 5 });
  const artisansValidated = useListArtisansQuery({ status: 'validated', ...COUNT_ONLY });
  const usersTotal = useListUsersQuery(COUNT_ONLY);
  const usersSuspended = useListUsersQuery({ status: 'suspended', ...COUNT_ONLY });
  const reviewsPending = useListReviewsQuery({ status: 'pending', limit: 5 });
  const categories = useListCategoriesQuery();

  const pendingArtisans = artisansPending.data?.items ?? [];
  const pendingReviews = reviewsPending.data?.items ?? [];

  return (
    <>
      <DashboardHeader />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Hammer}
          label="Artisans à valider"
          value={artisansPending.data?.totalItems}
          loading={artisansPending.isLoading}
          to="/artisans?status=pending"
          tone="amber"
        />
        <StatCard
          icon={UserCheck}
          label="Artisans publiés"
          value={artisansValidated.data?.totalItems}
          loading={artisansValidated.isLoading}
          to="/artisans?status=validated"
          tone="brand"
        />
        <StatCard
          icon={Star}
          label="Avis à modérer"
          value={reviewsPending.data?.totalItems}
          loading={reviewsPending.isLoading}
          to="/avis"
          tone="violet"
        />
        <StatCard
          icon={Users}
          label="Comptes suspendus"
          value={usersSuspended.data?.totalItems}
          loading={usersSuspended.isLoading}
          to="/utilisateurs?status=suspended"
          tone="slate"
        />
        <StatCard
          icon={Users}
          label="Utilisateurs"
          value={usersTotal.data?.totalItems}
          loading={usersTotal.isLoading}
          to="/utilisateurs"
          tone="blue"
        />
        <StatCard
          icon={Hammer}
          label="Fiches artisans"
          value={artisansTotal.data?.totalItems}
          loading={artisansTotal.isLoading}
          to="/artisans"
          tone="brand"
        />
        <StatCard
          icon={Tags}
          label="Catégories"
          value={categories.data?.length}
          loading={categories.isLoading}
          to="/catalogue"
          tone="blue"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card>
          <PanelHeader
            icon={Hammer}
            title="Derniers artisans à valider"
            count={artisansPending.data?.totalItems}
            to="/artisans?status=pending"
          />
          {artisansPending.isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : pendingArtisans.length === 0 ? (
            <EmptyState
              icon={Hammer}
              title="Aucun artisan en attente"
              description="Les nouvelles inscriptions apparaîtront ici."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingArtisans.map((artisan) => (
                <li
                  key={artisan._id}
                  className="flex items-center gap-4 px-6 py-4 transition-colors duration-base hover:bg-slate-50/80"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-sm font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/10">
                    {initials(artisan.userId)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {artisan.displayName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {artisan.location?.commune || 'Commune non renseignée'}
                    </p>
                  </div>
                  <span className="hidden text-xs text-slate-400 md:block">
                    {formatDate(artisan.createdAt)}
                  </span>
                  <StatusBadge value={artisan.status} map={ARTISAN_STATUS} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <PanelHeader
            icon={Star}
            title="Avis à modérer"
            count={reviewsPending.data?.totalItems}
            to="/avis"
          />
          {reviewsPending.isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : pendingReviews.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Aucun avis en attente"
              description="La file de modération est vide."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingReviews.map((review) => (
                <li
                  key={review._id}
                  className="px-6 py-4 transition-colors duration-base hover:bg-slate-50/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {fullName(review.client)}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        Avis sur {review.artisan?.displayName ?? 'artisan supprimé'}
                      </p>
                    </div>
                    <Badge
                      tone={
                        review.rating >= 4
                          ? 'green'
                          : review.rating >= 3
                            ? 'amber'
                            : 'red'
                      }
                    >
                      {review.rating}/5
                    </Badge>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{review.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
