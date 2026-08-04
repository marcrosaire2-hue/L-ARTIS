import { useCallback, useState } from 'react';
import { Ban, CalendarDays, Check, Hammer, X } from 'lucide-react';
import { useListArtisansQuery, useSetArtisanStatusMutation } from '../features/artisans/artisans.api';
import { useListParams } from '../lib/useListParams';
import SearchInput from '../components/SearchInput';
import ConfirmAction from '../components/ConfirmAction';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  ListCard,
  PageHeader,
  Pagination,
  Select,
  Spinner,
  StatusBadge,
} from '../components/ui';
import {
  ARTISAN_STATUS,
  cleanParams,
  errorMessage,
  formatDate,
  formatNumber,
  fullName,
} from '../lib/format';

// L'API ne propose pas d'endpoint d'agrégation : le total est lu via
// `totalItems`, avec limit=1 pour ne pas rapatrier les documents.
const COUNT_ONLY = { limit: 1 };

const HEADERS = [
  { label: 'Artisan' },
  { label: 'Responsable' },
  { label: 'Localisation' },
  { label: 'Note' },
  { label: 'Statut' },
  { label: 'Inscrit le' },
  { label: 'Actions', className: 'text-right' },
];

/** Décrit la modale de confirmation selon le statut visé. */
function actionFor(artisan, status) {
  const base = { artisan, status, description: artisan.displayName };
  if (status === 'validated') {
    return {
      ...base,
      title: 'Publier cette fiche artisan ?',
      confirmLabel: 'Valider',
      variant: 'primary',
      reason: 'optional',
      reasonLabel: 'Message de bienvenue',
      reasonHint: "Facultatif — ajouté à l'e-mail de validation.",
    };
  }
  if (status === 'rejected') {
    return {
      ...base,
      title: 'Refuser cette fiche artisan ?',
      confirmLabel: 'Refuser',
      variant: 'danger',
      reason: 'required',
      reasonLabel: 'Motif du refus',
    };
  }
  return {
    ...base,
    title: 'Suspendre cet artisan ?',
    confirmLabel: 'Suspendre',
    variant: 'danger',
    reason: 'required',
    reasonLabel: 'Motif de la suspension',
    reasonHint: 'Le compte sera suspendu et toutes ses sessions fermées.',
  };
}

function ArtisanStatsCard({ total, loading }) {
  return (
    <Card className="flex w-full items-center gap-4 p-4 sm:min-w-64 sm:p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-panel bg-gradient-to-br from-violet-100 to-violet-200/70 text-violet-700">
        <Hammer className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {loading ? (
          <Spinner className="size-6" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(total)}
          </p>
        )}
        <p className="mt-1 text-sm text-slate-500">Fiches artisans</p>
      </div>
    </Card>
  );
}

function ArtisanActions({ artisan, onAction }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {artisan.status !== 'validated' && (
        <Button size="sm" onClick={() => onAction(actionFor(artisan, 'validated'))} title="Publier la fiche">
          <Check className="size-3.5" aria-hidden="true" />
          Valider
        </Button>
      )}
      {artisan.status !== 'rejected' && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onAction(actionFor(artisan, 'rejected'))}
          title="Refuser la fiche"
        >
          <X className="size-3.5" aria-hidden="true" />
          Refuser
        </Button>
      )}
      {artisan.status !== 'suspended' && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAction(actionFor(artisan, 'suspended'))}
          title="Suspendre l'artisan"
          className="size-8 rounded-control p-0 hover:bg-red-50 hover:text-red-600"
        >
          <Ban className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export default function ArtisansPage() {
  const { filters, page, update, setPage } = useListParams({ status: '', q: '' });
  const { data, isLoading, isFetching, isError, error, refetch } = useListArtisansQuery(
    cleanParams({ ...filters, page })
  );
  const artisansTotal = useListArtisansQuery(COUNT_ONLY);
  const [setArtisanStatus, { isLoading: isSaving }] = useSetArtisanStatusMutation();

  const [action, setAction] = useState(null);
  const [actionError, setActionError] = useState(null);

  const onSearch = useCallback((q) => update({ q }), [update]);

  const closeAction = () => {
    setAction(null);
    setActionError(null);
  };

  const confirmAction = async (reason) => {
    setActionError(null);
    try {
      await setArtisanStatus({ id: action.artisan._id, status: action.status, reason }).unwrap();
      closeAction();
    } catch (requestError) {
      setActionError(errorMessage(requestError, 'La mise à jour a échoué.'));
    }
  };

  const artisans = data?.items ?? [];

  return (
    <>
      <PageHeader
        icon={Hammer}
        title="Artisans"
        description="Validation, refus et suspension des fiches professionnelles."
        actions={
          <ArtisanStatsCard total={artisansTotal.data?.totalItems} loading={artisansTotal.isLoading} />
        }
      />

      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={filters.q}
            onChange={onSearch}
            placeholder="Nom commercial, compétence…"
          />
          <Select
            value={filters.status}
            onChange={(event) => update({ status: event.target.value })}
            aria-label="Filtrer par statut"
            className="w-auto min-w-36"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(ARTISAN_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          {isFetching && !isLoading && <Spinner className="size-4" />}
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : artisans.length === 0 ? (
          <EmptyState
            icon={Hammer}
            title="Aucun artisan"
            description="Aucune fiche ne correspond à ces critères."
          />
        ) : (
          <>
            <DataTable
              headers={HEADERS}
              mobile={artisans.map((artisan) => (
                <ListCard key={artisan._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar user={{ firstName: artisan.displayName }} tone="brand" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {artisan.displayName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {artisan.location?.commune || '—'}
                          {artisan.location?.department ? ` · ${artisan.location.department}` : ''}
                        </p>
                      </div>
                    </div>
                    <StatusBadge value={artisan.status} map={ARTISAN_STATUS} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="truncate">{fullName(artisan.userId)}</span>
                    <span className="text-slate-300">·</span>
                    {artisan.rating?.count ? (
                      <Badge tone={artisan.rating.average >= 4 ? 'green' : 'amber'}>
                        {artisan.rating.average}/5
                      </Badge>
                    ) : (
                      <span>Aucun avis</span>
                    )}
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5 text-slate-400" aria-hidden="true" />
                      {formatDate(artisan.createdAt)}
                    </span>
                  </div>
                  <ArtisanActions artisan={artisan} onAction={setAction} />
                </ListCard>
              ))}
            >
              {artisans.map((artisan) => (
                <tr
                  key={artisan._id}
                  className="transition-colors duration-base hover:bg-slate-50/80"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar user={{ firstName: artisan.displayName }} tone="brand" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {artisan.displayName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {artisan.skills?.length
                            ? artisan.skills.slice(0, 2).join(' · ')
                            : artisan.tagline || artisan.artisanId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar user={artisan.userId} size="sm" tone="slate" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {fullName(artisan.userId)}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {artisan.userId?.email}
                        </p>
                        {Boolean(artisan.contactPhone || artisan.userId?.phone) && (
                          <p className="truncate text-xs text-slate-400">
                            {artisan.contactPhone || artisan.userId?.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <p className="text-sm">{artisan.location?.commune || '—'}</p>
                    {artisan.location?.department ? (
                      <p className="truncate text-xs text-slate-400">
                        {artisan.location.department}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    {artisan.rating?.count ? (
                      <Badge tone={artisan.rating.average >= 4 ? 'green' : 'amber'}>
                        {artisan.rating.average}/5 ({artisan.rating.count})
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Aucun avis</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge value={artisan.status} map={ARTISAN_STATUS} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                      <CalendarDays className="size-3.5 text-slate-400" aria-hidden="true" />
                      {formatDate(artisan.createdAt)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <ArtisanActions artisan={artisan} onAction={setAction} />
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.totalItems}
              onChange={setPage}
            />
          </>
        )}
      </Card>

      <ConfirmAction
        action={action}
        onClose={closeAction}
        onConfirm={confirmAction}
        loading={isSaving}
        error={actionError}
      />
    </>
  );
}
