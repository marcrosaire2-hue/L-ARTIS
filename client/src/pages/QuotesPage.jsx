import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ClipboardList } from 'lucide-react';
import { selectUser } from '../features/auth/authSlice';
import {
  useListArtisanQuotesQuery,
  useListMyQuotesQuery,
} from '../features/quotes/quotes.api';
import { Badge, Card, Container, EmptyState, Loading } from '../components/ui';
import { formatDate, timeAgo } from '../lib/format';

const STATUS_LABELS = {
  pending: { label: 'En attente', tone: 'amber' },
  accepted: { label: 'Accepté', tone: 'green' },
  rejected: { label: 'Refusé', tone: 'red' },
  completed: { label: 'Terminé', tone: 'slate' },
};

export default function QuotesPage() {
  const user = useSelector(selectUser);
  const isArtisan = user?.role === 'artisan';

  const clientQuery = useListMyQuotesQuery(undefined, { skip: isArtisan });
  const artisanQuery = useListArtisanQuotesQuery(undefined, { skip: !isArtisan });

  const { data, isLoading, isError } = isArtisan ? artisanQuery : clientQuery;
  const items = data?.items ?? [];

  if (isLoading) return <Loading label="Chargement des devis…" />;

  return (
    <Container className="py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mes devis</h1>
          <p className="mt-1 text-slate-600">
            {isArtisan
              ? 'Demandes reçues de vos clients.'
              : 'Vos demandes envoyées aux artisans.'}
          </p>
        </div>
        {!isArtisan && (
          <Link to="/recherche">
            <Badge tone="green">+ Nouvelle demande via un artisan</Badge>
          </Link>
        )}
      </div>

      {isError ? (
        <Card className="p-6">
          <p className="text-slate-600">Impossible de charger vos devis.</p>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucun devis"
          description={
            isArtisan
              ? 'Les demandes de vos clients apparaîtront ici.'
              : 'Trouvez un artisan et demandez un devis depuis sa fiche.'
          }
          action={
            !isArtisan ? (
              <Link to="/recherche" className="mt-2">
                <Badge tone="green">Rechercher un artisan</Badge>
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((quote) => {
            const status = STATUS_LABELS[quote.status] ?? STATUS_LABELS.pending;
            const counterpart = isArtisan
              ? quote.client?.firstName
                ? `${quote.client.firstName} ${quote.client.lastName ?? ''}`.trim()
                : 'Client'
              : quote.artisan?.displayName ?? 'Artisan';

            return (
              <Link key={quote._id} to={`/devis/${quote._id}`}>
                <Card className="p-5 transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{quote.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{counterpart}</p>
                      {quote.reference && (
                        <p className="mt-1 font-mono text-xs text-slate-400">{quote.reference}</p>
                      )}
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{quote.description}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatDate(quote.createdAt)} · {timeAgo(quote.createdAt)}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
