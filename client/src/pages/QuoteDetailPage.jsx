import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { selectUser } from '../features/auth/authSlice';
import {
  useGetQuoteQuery,
  useRespondToQuoteMutation,
  useUpdateQuoteStatusMutation,
} from '../features/quotes/quotes.api';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Field,
  Input,
  Loading,
  Textarea,
} from '../components/ui';
import { errorMessage, formatDate, formatPrice, fullName } from '../lib/format';

const STATUS_LABELS = {
  pending: { label: 'En attente', tone: 'amber' },
  accepted: { label: 'Accepté', tone: 'green' },
  rejected: { label: 'Refusé', tone: 'red' },
  completed: { label: 'Terminé', tone: 'slate' },
};

function ArtisanRespondForm({ quote }) {
  const [respond, { isLoading }] = useRespondToQuoteMutation();
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const submit = async (status) => {
    setError(null);
    try {
      await respond({
        id: quote._id,
        status,
        ...(status === 'accepted' && {
          price: Number(price),
          durationDays: Number(durationDays),
          message: message.trim(),
        }),
      }).unwrap();
      setDone(true);
    } catch (submitError) {
      setError(errorMessage(submitError, "La réponse n'a pas pu être envoyée."));
    }
  };

  if (done) {
    return <Alert tone="green">Votre réponse a été enregistrée.</Alert>;
  }

  return (
    <Card className="p-5">
      <p className="font-semibold text-slate-900">Répondre à la demande</p>
      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}
      <div className="mt-4 flex flex-col gap-4">
        <Field label="Prix proposé (FCFA)" required>
          <Input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        <Field label="Durée estimée (jours)" required>
          <Input
            type="number"
            min="1"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
          />
        </Field>
        <Field label="Message au client">
          <Textarea
            rows={3}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Précisez les conditions, la disponibilité…"
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button
            loading={isLoading}
            onClick={() => submit('accepted')}
            disabled={!price || !durationDays}
          >
            Accepter et proposer
          </Button>
          <Button variant="secondary" loading={isLoading} onClick={() => submit('rejected')}>
            Refuser
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ClientActions({ quote }) {
  const [updateStatus, { isLoading }] = useUpdateQuoteStatusMutation();
  const [error, setError] = useState(null);

  const handleStatus = async (status) => {
    setError(null);
    try {
      await updateStatus({ id: quote._id, status }).unwrap();
    } catch (statusError) {
      setError(errorMessage(statusError, 'Action impossible.'));
    }
  };

  if (quote.status === 'pending') {
    return (
      <Card className="p-5">
        <p className="text-slate-600">En attente de la réponse de l'artisan.</p>
      </Card>
    );
  }

  if (quote.status === 'accepted') {
    return (
      <Card className="p-5">
        <p className="font-semibold text-slate-900">Proposition de l'artisan</p>
        {quote.response && (
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Prix</dt>
              <dd className="font-medium text-slate-900">{formatPrice(quote.response.price)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Durée</dt>
              <dd className="font-medium text-slate-900">
                {quote.response.durationDays} jour{quote.response.durationDays > 1 ? 's' : ''}
              </dd>
            </div>
            {quote.response.message && (
              <p className="mt-2 text-slate-700">{quote.response.message}</p>
            )}
          </dl>
        )}
        {error && (
          <div className="mt-3">
            <Alert>{error}</Alert>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button loading={isLoading} onClick={() => handleStatus('completed')}>
            Marquer comme terminé
          </Button>
          <Button variant="secondary" loading={isLoading} onClick={() => handleStatus('rejected')}>
            Annuler
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}

export default function QuoteDetailPage() {
  const { id } = useParams();
  const user = useSelector(selectUser);
  const { data: quote, isLoading, isError, error } = useGetQuoteQuery(id);

  if (isLoading) return <Loading label="Chargement du devis…" />;

  if (isError || !quote) {
    return (
      <Container className="py-16">
        <Alert>{errorMessage(error, 'Devis introuvable.')}</Alert>
        <Link to="/devis" className="mt-4 inline-block text-brand-700 hover:underline">
          ← Retour aux devis
        </Link>
      </Container>
    );
  }

  const isArtisan = user?.role === 'artisan';
  const status = STATUS_LABELS[quote.status] ?? STATUS_LABELS.pending;

  return (
    <Container className="py-10">
      <Link
        to="/devis"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Mes devis
      </Link>

      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{quote.title}</h1>
            {quote.reference && (
              <p className="mt-1 font-mono text-sm text-slate-400">{quote.reference}</p>
            )}
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>

        <Card className="mb-4 p-6">
          <p className="whitespace-pre-line text-slate-700">{quote.description}</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Client</dt>
              <dd className="font-medium text-slate-900">
                {fullName(quote.client) || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Artisan</dt>
              <dd className="font-medium text-slate-900">
                {quote.artisan?.displayName ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Créé le</dt>
              <dd className="font-medium text-slate-900">{formatDate(quote.createdAt)}</dd>
            </div>
            {quote.preferredDate && (
              <div>
                <dt className="text-slate-500">Date souhaitée</dt>
                <dd className="font-medium text-slate-900">{formatDate(quote.preferredDate)}</dd>
              </div>
            )}
          </dl>
        </Card>

        {isArtisan && quote.status === 'pending' && <ArtisanRespondForm quote={quote} />}
        {!isArtisan && <ClientActions quote={quote} />}
      </div>
    </Container>
  );
}
