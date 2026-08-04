import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Clock } from 'lucide-react';
import { useGetMyArtisanQuery } from '../features/artisans/artisans.api';
import { selectIsAuthenticated, selectUser } from '../features/auth/authSlice';
import { Alert, Button, Card, Container, LinkButton, Loading } from '../components/ui';

/**
 * Après vérification e-mail, l'artisan attend la validation admin.
 * Un e-mail de bienvenue est envoyé lorsque le compte est validé.
 */
export default function PendingValidationPage() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const { data, isLoading, isFetching } = useGetMyArtisanQuery(undefined, {
    skip: !isAuthenticated || user?.role !== 'artisan',
    pollingInterval: 20000,
    refetchOnFocus: true,
  });

  const artisan = data?.artisan;
  const status = artisan?.status;

  useEffect(() => {
    if (status === 'validated') navigate('/artisan', { replace: true });
  }, [status, navigate]);

  if (!isAuthenticated) return <Navigate to="/connexion" replace />;
  if (user?.role !== 'artisan') return <Navigate to="/" replace />;
  if (isLoading) return <Loading label="Chargement…" />;

  if (status === 'rejected') {
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Profil refusé</h1>
          <p className="mt-3 text-slate-600">
            {artisan?.rejectionReason ||
              'Votre profil a été refusé. Corrigez vos informations puis contactez le support.'}
          </p>
          <Button className="mt-6" onClick={() => navigate('/artisan')}>
            Compléter mon profil
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-lg p-8 text-center">
        <Clock className="mx-auto size-12 text-brand-600" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">En attente de validation</h1>
        <p className="mt-3 text-slate-600">
          Merci de patienter. Notre équipe examine votre profil artisan avant publication. Vous
          recevrez un e-mail de bienvenue dès que votre compte sera validé.
        </p>

        <div className="mt-6 text-left">
          <Alert tone="amber">
            Délai habituel : 24 à 48 h.
            {isFetching ? ' Vérification du statut…' : ''}
          </Alert>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate('/artisan')}>Compléter mon profil</Button>
          <LinkButton variant="secondary" href="/">
            Retour à l&apos;accueil
          </LinkButton>
        </div>
      </Card>
    </Container>
  );
}
