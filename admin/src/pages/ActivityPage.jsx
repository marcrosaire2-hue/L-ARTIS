import { useMemo } from 'react';
import {
  Activity,
  Ban,
  Check,
  EyeOff,
  FolderTree,
  Globe2,
  KeyRound,
  MapPin,
  Shield,
  Star,
  Trash2,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import { useListActivitiesQuery } from '../features/activities/activities.api';
import { useListAdminsQuery } from '../features/admins/admins.api';
import { useListParams } from '../lib/useListParams';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Select,
  Spinner,
} from '../components/ui';
import { cleanParams, errorMessage, formatNumber, fullName } from '../lib/format';

const ACTION_META = {
  'artisan.validated': { label: 'Artisan publié', tone: 'green', icon: Check },
  'artisan.rejected': { label: 'Artisan refusé', tone: 'red', icon: Ban },
  'artisan.suspended': { label: 'Artisan suspendu', tone: 'amber', icon: Ban },
  'user.suspended': { label: 'Compte suspendu', tone: 'red', icon: Ban },
  'user.active': { label: 'Compte réactivé', tone: 'green', icon: Users },
  'user.deleted': { label: 'Compte supprimé', tone: 'red', icon: Trash2 },
  'user.password_reset': { label: 'Mot de passe réinitialisé', tone: 'blue', icon: KeyRound },
  'review.approved': { label: 'Avis publié', tone: 'green', icon: Star },
  'review.hidden': { label: 'Avis masqué', tone: 'slate', icon: EyeOff },
  'admin.created': { label: 'Admin créé', tone: 'purple', icon: UserPlus },
  'category.created': { label: 'Catégorie créée', tone: 'blue', icon: FolderTree },
  'category.updated': { label: 'Catégorie modifiée', tone: 'blue', icon: FolderTree },
  'category.deleted': { label: 'Catégorie supprimée', tone: 'red', icon: FolderTree },
  'trade.created': { label: 'Métier créé', tone: 'blue', icon: Wrench },
  'trade.updated': { label: 'Métier modifié', tone: 'blue', icon: Wrench },
  'trade.deleted': { label: 'Métier supprimé', tone: 'red', icon: Wrench },
};

const TARGET_LABELS = {
  artisan: 'Artisan',
  user: 'Utilisateur',
  review: 'Avis',
  admin: 'Administrateur',
  category: 'Catégorie',
  trade: 'Métier',
  system: 'Système',
};

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

function ActivityStats({ total, loading }) {
  return (
    <Card className="flex w-full items-center gap-4 p-4 sm:min-w-64 sm:p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-panel bg-gradient-to-br from-sky-100 to-sky-200/70 text-sky-700">
        <Globe2 className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {loading ? (
          <Spinner className="size-6" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(total)}
          </p>
        )}
        <p className="mt-1 text-sm text-slate-500">Effets enregistrés</p>
      </div>
    </Card>
  );
}

function ActivityItem({ item }) {
  const meta = ACTION_META[item.action] ?? {
    label: item.action,
    tone: 'slate',
    icon: Activity,
  };
  const Icon = meta.icon;
  const actor = item.actor;

  return (
    <article className="relative flex gap-4 border-b border-slate-100 px-4 py-5 last:border-b-0 sm:px-6">
      <span
        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${
          meta.tone === 'green'
            ? 'bg-brand-50 text-brand-700 ring-brand-600/15'
            : meta.tone === 'red'
              ? 'bg-red-50 text-red-700 ring-red-600/15'
              : meta.tone === 'amber'
                ? 'bg-amber-50 text-amber-700 ring-amber-600/15'
                : meta.tone === 'purple'
                  ? 'bg-violet-50 text-violet-700 ring-violet-600/15'
                  : meta.tone === 'blue'
                    ? 'bg-sky-50 text-sky-700 ring-sky-600/15'
                    : 'bg-slate-50 text-slate-600 ring-slate-500/15'
        }`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {TARGET_LABELS[item.targetType] && (
            <Badge tone="slate">{TARGET_LABELS[item.targetType]}</Badge>
          )}
          <span className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</span>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-slate-800">
          <span className="font-semibold text-slate-900">{fullName(actor)}</span>{' '}
          {item.summary}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Avatar user={actor} size="sm" />
            {actor?.email || 'Compte admin'}
          </span>
          {item.ip ? (
            <span className="inline-flex items-center gap-1" title="Adresse IP">
              <MapPin className="size-3.5 text-slate-400" aria-hidden="true" />
              {item.ip}
            </span>
          ) : null}
          {item.meta?.reason ? (
            <span className="max-w-full truncate italic text-slate-400">
              Motif : {item.meta.reason}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function ActivityPage() {
  const { filters, page, update, setPage } = useListParams({ actor: '', action: '' });
  const admins = useListAdminsQuery();
  const { data, isLoading, isFetching, isError, error, refetch } = useListActivitiesQuery(
    cleanParams({ ...filters, page, limit: 20 })
  );

  const items = data?.items ?? [];
  const actionOptions = useMemo(
    () =>
      Object.entries(ACTION_META).map(([value, { label }]) => ({
        value,
        label,
      })),
    []
  );

  return (
    <>
      <PageHeader
        icon={Activity}
        title="Traçabilité"
        description="Journal des effets concrets produits par les administrateurs sur la plateforme."
        actions={
          <ActivityStats total={data?.totalItems} loading={isLoading && !data} />
        }
      />

      <Card className="mb-6 border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm">
            <Globe2 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Empreinte des décisions</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Chaque validation, suspension, modération ou modification du catalogue laisse une
              trace ici — qui a agi, quand, depuis quelle connexion, et quel a été l’effet.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filters.actor}
            onChange={(event) => update({ actor: event.target.value })}
            aria-label="Filtrer par administrateur"
            className="w-full min-w-44 sm:w-auto"
          >
            <option value="">Tous les administrateurs</option>
            {(admins.data ?? []).map((admin) => (
              <option key={admin.id} value={admin.user?.id || admin.user?._id}>
                {fullName(admin.user)}
              </option>
            ))}
          </Select>
          <Select
            value={filters.action}
            onChange={(event) => update({ action: event.target.value })}
            aria-label="Filtrer par type d’effet"
            className="w-full min-w-44 sm:w-auto"
          >
            <option value="">Tous les effets</option>
            {actionOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          {isFetching && !isLoading && <Spinner className="size-4" />}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Aucun effet enregistré"
            description="Les prochaines actions d’administration apparaîtront ici automatiquement."
          />
        ) : (
          <>
            <div>
              {items.map((item) => (
                <ActivityItem key={item._id} item={item} />
              ))}
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.totalItems}
              onChange={setPage}
            />
          </>
        )}
      </Card>
    </>
  );
}
