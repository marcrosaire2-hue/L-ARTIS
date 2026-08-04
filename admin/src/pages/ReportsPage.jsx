import { useState } from 'react';
import { CalendarDays, Check, Flag, X } from 'lucide-react';
import { useListReportsQuery, useHandleReportMutation } from '../features/reports/reports.api';
import { useListParams } from '../lib/useListParams';
import ConfirmAction from '../components/ConfirmAction';
import {
  Avatar,
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
  REPORT_REASONS,
  REPORT_STATUS,
  REPORT_TARGET_TYPES,
  cleanParams,
  errorMessage,
  formatDate,
  formatNumber,
  fullName,
} from '../lib/format';

const COUNT_ONLY = { limit: 1 };

const HEADERS = [
  { label: 'Signaleur' },
  { label: 'Cible' },
  { label: 'Motif' },
  { label: 'Description' },
  { label: 'Statut' },
  { label: 'Date' },
  { label: 'Actions', className: 'text-right' },
];

function ReportsStatsCard({ total, loading }) {
  return (
    <Card className="flex w-full items-center gap-4 p-4 sm:min-w-64 sm:p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-panel bg-gradient-to-br from-amber-100 to-amber-200/70 text-amber-700">
        <Flag className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {loading ? (
          <Spinner className="size-6" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(total)}
          </p>
        )}
        <p className="mt-1 text-sm text-slate-500">Signalements en attente</p>
      </div>
    </Card>
  );
}

function ReportActions({ report, onReview, onDismiss }) {
  if (report.status !== 'pending') return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button size="sm" onClick={() => onReview(report)}>
        <Check className="size-3.5" aria-hidden="true" />
        Traiter
      </Button>
      <Button size="sm" variant="secondary" onClick={() => onDismiss(report)}>
        <X className="size-3.5" aria-hidden="true" />
        Classer
      </Button>
    </div>
  );
}

function targetLabel(report) {
  const type = REPORT_TARGET_TYPES[report.targetType] ?? report.targetType;
  return `${type} · ${report.targetId?.slice?.(-6) ?? '—'}`;
}

export default function ReportsPage() {
  const { filters, page, update, setPage } = useListParams({ status: 'pending' });
  const { data, isLoading, isFetching, isError, error, refetch } = useListReportsQuery(
    cleanParams({ status: filters.status === 'all' ? '' : filters.status, page })
  );
  const reportsPending = useListReportsQuery({ status: 'pending', ...COUNT_ONLY });
  const [handleReport, { isLoading: isSaving }] = useHandleReportMutation();

  const [action, setAction] = useState(null);
  const [actionError, setActionError] = useState(null);

  const closeAction = () => {
    setAction(null);
    setActionError(null);
  };

  const confirmAction = async (resolutionNote) => {
    setActionError(null);
    try {
      await handleReport({
        id: action.report._id,
        status: action.status,
        resolutionNote: resolutionNote || undefined,
      }).unwrap();
      closeAction();
    } catch (requestError) {
      setActionError(errorMessage(requestError, 'Le traitement a échoué.'));
    }
  };

  const reviewAction = (report) => ({
    report,
    status: 'reviewed',
    title: 'Marquer ce signalement comme traité ?',
    description: 'Le signaleur sera informé que son signalement a été examiné et pris en compte.',
    confirmLabel: 'Traiter',
    variant: 'primary',
    reason: 'optional',
    reasonLabel: 'Note interne',
    reasonHint: 'Facultatif — visible par les administrateurs uniquement.',
  });

  const dismissAction = (report) => ({
    report,
    status: 'dismissed',
    title: 'Classer ce signalement sans suite ?',
    description: 'Le signaleur sera informé que son signalement a été examiné sans action supplémentaire.',
    confirmLabel: 'Classer',
    variant: 'secondary',
    reason: 'optional',
    reasonLabel: 'Note interne',
    reasonHint: 'Facultatif — visible par les administrateurs uniquement.',
  });

  const reports = data?.items ?? [];

  return (
    <>
      <PageHeader
        icon={Flag}
        title="Signalements"
        description="Examen des signalements déposés par les utilisateurs."
        actions={
          <ReportsStatsCard
            total={reportsPending.data?.totalItems}
            loading={reportsPending.isLoading}
          />
        }
      />

      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filters.status}
            onChange={(event) => update({ status: event.target.value })}
            aria-label="Filtrer par statut"
            className="w-auto min-w-36"
          >
            <option value="all">Tous les signalements</option>
            {Object.entries(REPORT_STATUS).map(([value, { label }]) => (
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
        ) : reports.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="Aucun signalement"
            description="Aucun signalement ne correspond à ce filtre."
          />
        ) : (
          <>
            <DataTable
              headers={HEADERS}
              mobile={reports.map((report) => (
                <ListCard key={report._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar user={report.reporter} tone="brand" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {fullName(report.reporter)}
                        </p>
                        <p className="truncate text-xs text-slate-500">{targetLabel(report)}</p>
                      </div>
                    </div>
                    <StatusBadge value={report.status} map={REPORT_STATUS} />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {REPORT_REASONS[report.reason] ?? report.reason}
                  </p>
                  {report.description ? (
                    <p className="line-clamp-3 text-sm text-slate-600">{report.description}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays className="size-3.5 text-slate-400" aria-hidden="true" />
                      {formatDate(report.createdAt)}
                    </span>
                    <ReportActions
                      report={report}
                      onReview={(r) => setAction(reviewAction(r))}
                      onDismiss={(r) => setAction(dismissAction(r))}
                    />
                  </div>
                </ListCard>
              ))}
            >
              {reports.map((report) => (
                <tr
                  key={report._id}
                  className="transition-colors duration-base hover:bg-slate-50/80"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar user={report.reporter} tone="brand" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {fullName(report.reporter)}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {report.reporter?.role === 'artisan' ? 'Artisan' : 'Client'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-700">{targetLabel(report)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-700">
                      {REPORT_REASONS[report.reason] ?? report.reason}
                    </p>
                  </td>
                  <td className="max-w-md px-5 py-4">
                    <p className="line-clamp-2 text-sm text-slate-600">
                      {report.description || '—'}
                    </p>
                    {report.resolutionNote ? (
                      <p className="mt-1 truncate text-xs text-brand-700/80">
                        Note : {report.resolutionNote}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge value={report.status} map={REPORT_STATUS} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                      <CalendarDays className="size-3.5 text-slate-400" aria-hidden="true" />
                      {formatDate(report.createdAt)}
                    </span>
                    {report.handledAt ? (
                      <p className="mt-1 text-xs text-slate-400">
                        Traité le {formatDate(report.handledAt)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <ReportActions
                        report={report}
                        onReview={(r) => setAction(reviewAction(r))}
                        onDismiss={(r) => setAction(dismissAction(r))}
                      />
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
