import { useState } from 'react';
import { CalendarDays, Check, EyeOff, Star } from 'lucide-react';
import { useListReviewsQuery, useSetReviewStatusMutation } from '../features/reviews/reviews.api';
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
  REVIEW_STATUS,
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
  { label: 'Client' },
  { label: 'Artisan' },
  { label: 'Note' },
  { label: 'Avis' },
  { label: 'Statut' },
  { label: 'Date' },
  { label: 'Actions', className: 'text-right' },
];

function Stars({ value }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={`size-4 ${index <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function ReviewsStatsCard({ total, loading }) {
  return (
    <Card className="flex w-full items-center gap-4 p-4 sm:min-w-64 sm:p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-panel bg-gradient-to-br from-violet-100 to-violet-200/70 text-violet-700">
        <Star className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {loading ? (
          <Spinner className="size-6" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(total)}
          </p>
        )}
        <p className="mt-1 text-sm text-slate-500">Avis à modérer</p>
      </div>
    </Card>
  );
}

function ReviewActions({ review, onApprove, onHide }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {review.status !== 'approved' && (
        <Button size="sm" onClick={() => onApprove(review)}>
          <Check className="size-3.5" aria-hidden="true" />
          Publier
        </Button>
      )}
      {review.status !== 'hidden' && (
        <Button size="sm" variant="secondary" onClick={() => onHide(review)}>
          <EyeOff className="size-3.5" aria-hidden="true" />
          Masquer
        </Button>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  // La file de modération est la vue par défaut ; 'all' lève le filtre.
  const { filters, page, update, setPage } = useListParams({ status: 'pending' });
  const { data, isLoading, isFetching, isError, error, refetch } = useListReviewsQuery(
    cleanParams({ status: filters.status === 'all' ? '' : filters.status, page })
  );
  const reviewsPending = useListReviewsQuery({ status: 'pending', ...COUNT_ONLY });
  const [setReviewStatus, { isLoading: isSaving }] = useSetReviewStatusMutation();

  const [action, setAction] = useState(null);
  const [actionError, setActionError] = useState(null);

  const closeAction = () => {
    setAction(null);
    setActionError(null);
  };

  const confirmAction = async () => {
    setActionError(null);
    try {
      await setReviewStatus({ id: action.review._id, status: action.status }).unwrap();
      closeAction();
    } catch (requestError) {
      setActionError(errorMessage(requestError, 'La modération a échoué.'));
    }
  };

  const approveAction = (review) => ({
    review,
    status: 'approved',
    title: 'Publier cet avis ?',
    description: "Il deviendra visible et sera intégré à la note moyenne de l'artisan.",
    confirmLabel: 'Publier',
    variant: 'primary',
    reason: 'none',
  });

  const hideAction = (review) => ({
    review,
    status: 'hidden',
    title: 'Masquer cet avis ?',
    description: "Il sera retiré de la fiche publique et du calcul de la note.",
    confirmLabel: 'Masquer',
    variant: 'danger',
    reason: 'none',
  });

  const reviews = data?.items ?? [];

  return (
    <>
      <PageHeader
        icon={Star}
        title="Avis"
        description="Modération des avis laissés par les clients sur les artisans."
        actions={
          <ReviewsStatsCard
            total={reviewsPending.data?.totalItems}
            loading={reviewsPending.isLoading}
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
            <option value="all">Tous les avis</option>
            {Object.entries(REVIEW_STATUS).map(([value, { label }]) => (
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
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Aucun avis"
            description="Aucun avis ne correspond à ce filtre."
          />
        ) : (
          <>
            <DataTable
              headers={HEADERS}
              mobile={reviews.map((review) => (
                <ListCard key={review._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar user={review.client} tone="brand" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {fullName(review.client)}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {review.artisan?.displayName ?? 'Artisan supprimé'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge value={review.status} map={REVIEW_STATUS} />
                  </div>
                  <Stars value={review.rating} />
                  <p className="line-clamp-3 text-sm text-slate-600">{review.comment}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays className="size-3.5 text-slate-400" aria-hidden="true" />
                      {formatDate(review.createdAt)}
                    </span>
                    <ReviewActions
                      review={review}
                      onApprove={(r) => setAction(approveAction(r))}
                      onHide={(r) => setAction(hideAction(r))}
                    />
                  </div>
                </ListCard>
              ))}
            >
              {reviews.map((review) => (
                <tr
                  key={review._id}
                  className="transition-colors duration-base hover:bg-slate-50/80"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar user={review.client} tone="brand" />
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {fullName(review.client)}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="truncate text-sm text-slate-700">
                      {review.artisan?.displayName ?? 'Artisan supprimé'}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <Stars value={review.rating} />
                  </td>
                  <td className="max-w-md px-5 py-4">
                    <p className="line-clamp-2 text-sm text-slate-600">{review.comment}</p>
                    {review.reply?.text && (
                      <p className="mt-1 truncate text-xs text-brand-700/80">
                        Réponse de l'artisan : {review.reply.text}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge value={review.status} map={REVIEW_STATUS} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                      <CalendarDays className="size-3.5 text-slate-400" aria-hidden="true" />
                      {formatDate(review.createdAt)}
                    </span>
                    {review.moderatedAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        Modéré le {formatDate(review.moderatedAt)}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <ReviewActions
                        review={review}
                        onApprove={(r) => setAction(approveAction(r))}
                        onHide={(r) => setAction(hideAction(r))}
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
