import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import {
  useCancelSubscriptionMutation,
  useGetMySubscriptionQuery,
  useListPlansQuery,
  useSubscribeMutation,
} from '../features/subscriptions/subscriptions.api';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  Loading,
} from '../components/ui';
import { errorMessage, formatDate, formatPrice } from '../lib/format';

const FEATURE_LABELS = {
  maxGallery: 'Photos en galerie',
  featured: 'Mise en avant',
  prioritySupport: 'Support prioritaire',
  analytics: 'Statistiques',
};

function PlanFeatures({ features }) {
  if (!features) return null;
  return (
    <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
      {Object.entries(features).map(([key, value]) => (
        <li key={key} className="flex items-center gap-2">
          <span className={value ? 'text-brand-600' : 'text-slate-300'}>
            {value ? '✓' : '—'}
          </span>
          {FEATURE_LABELS[key] ?? key}
          {key === 'maxGallery' && value ? ` (${value})` : ''}
        </li>
      ))}
    </ul>
  );
}

export default function SubscriptionPage() {
  const { data: plans, isLoading: loadingPlans } = useListPlansQuery();
  const { data: subscription, isLoading: loadingSub } = useGetMySubscriptionQuery();
  const [subscribe, { isLoading: subscribing }] = useSubscribeMutation();
  const [cancel, { isLoading: canceling }] = useCancelSubscriptionMutation();
  const [period, setPeriod] = useState('monthly');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const handleSubscribe = async (plan) => {
    setError(null);
    setInfo(null);
    try {
      const result = await subscribe({ plan, period }).unwrap();
      setInfo(result?.payment?.note ?? 'Abonnement mis à jour.');
    } catch (subError) {
      setError(errorMessage(subError, "L'abonnement n'a pas pu être activé."));
    }
  };

  const handleCancel = async () => {
    setError(null);
    setInfo(null);
    try {
      await cancel().unwrap();
      setInfo('Abonnement annulé.');
    } catch (cancelError) {
      setError(errorMessage(cancelError, "L'annulation a échoué."));
    }
  };

  if (loadingPlans || loadingSub) return <Loading label="Chargement de l'abonnement…" />;

  const currentPlan = subscription?.plan ?? 'basic';
  const isActive = subscription?.status === 'active';

  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mon abonnement</h1>
        <p className="mt-1 text-slate-600">
          Formules pour artisans — visibilité et fonctionnalités avancées.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}
      {info && (
        <div className="mb-4">
          <Alert tone="green">{info}</Alert>
        </div>
      )}

      {subscription && (
        <Card className="mb-8 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Formule actuelle</p>
              <p className="text-lg font-semibold capitalize text-slate-900">{currentPlan}</p>
              {subscription.endDate && (
                <p className="mt-1 text-sm text-slate-600">
                  {isActive ? "Valide jusqu'au" : 'Expire le'} {formatDate(subscription.endDate)}
                </p>
              )}
            </div>
            <Badge tone={isActive ? 'green' : 'slate'}>
              {isActive ? 'Actif' : subscription.status}
            </Badge>
          </div>
          {isActive && currentPlan !== 'basic' && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              loading={canceling}
              onClick={handleCancel}
            >
              Annuler l'abonnement
            </Button>
          )}
        </Card>
      )}

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setPeriod('monthly')}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            period === 'monthly'
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Mensuel
        </button>
        <button
          type="button"
          onClick={() => setPeriod('yearly')}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            period === 'yearly'
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Annuel
        </button>
      </div>

      {!plans?.length ? (
        <EmptyState icon={CreditCard} title="Aucun plan disponible" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const price = period === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const isCurrent = currentPlan === plan.plan && isActive;

            return (
              <Card
                key={plan.plan}
                className={`p-6 ${isCurrent ? 'ring-2 ring-brand-500' : ''}`}
              >
                <p className="text-lg font-semibold text-slate-900">{plan.label}</p>
                <p className="mt-2 text-2xl font-bold text-brand-700">
                  {formatPrice(price)}
                  <span className="text-sm font-normal text-slate-500">
                    /{period === 'yearly' ? 'an' : 'mois'}
                  </span>
                </p>
                <PlanFeatures features={plan.features} />
                <Button
                  className="mt-4 w-full"
                  variant={isCurrent ? 'secondary' : 'primary'}
                  disabled={isCurrent}
                  loading={subscribing}
                  onClick={() => handleSubscribe(plan.plan)}
                >
                  {isCurrent ? 'Formule actuelle' : 'Choisir'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-slate-500">
        <Link to="/artisan" className="font-medium text-brand-700 hover:underline">
          Retour à mon espace artisan
        </Link>
      </p>
    </Container>
  );
}
