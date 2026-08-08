import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Card, Container } from '../components/ui';
import { LegalDocument } from '../components/LegalDocument';
import { useAcceptTermsMutation } from '../features/auth/auth.api';
import { selectUser, userUpdated } from '../features/auth/authSlice';
import { reglementArtisan } from '../lib/legal/reglementArtisan';
import { reglementClient } from '../lib/legal/reglementClient';
import { errorMessage } from '../lib/format';

const DOCUMENTS = {
  client: reglementClient,
  artisan: reglementArtisan,
};

/**
 * Règlement public (lecture) ou protocole post-inscription (?accept=1) :
 * lecture obligatoire puis validation enregistrée côté serveur.
 */
export default function ReglementPage() {
  const { audience } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const document = DOCUMENTS[audience];
  const acceptMode = searchParams.get('accept') === '1' && !user?.termsAcceptedAt;
  const email = searchParams.get('email') || user?.email || '';

  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState(null);
  const [acceptTerms, { isLoading }] = useAcceptTermsMutation();

  if (!document) {
    return <Navigate to="/mentions-legales" replace />;
  }

  const otherAudience = audience === 'artisan' ? 'client' : 'artisan';

  const onValidate = async () => {
    setError(null);
    if (!accepted) {
      setError('Cochez la case pour confirmer que vous avez lu et accepté le règlement.');
      return;
    }
    if (!user) {
      setError('Connectez-vous pour valider le règlement.');
      return;
    }

    try {
      const result = await acceptTerms().unwrap();
      if (result?.user) dispatch(userUpdated(result.user));

      const from = location.state?.from;
      if (from?.pathname) {
        navigate(`${from.pathname}${from.search || ''}`, { replace: true });
        return;
      }

      // Détour par la saisie du code seulement si l'inscription a confirmé
      // l'envoi. Sans envoi possible, l'étape est sautée.
      if (searchParams.get('verify') === '1' && email && !result?.user?.isEmailVerified) {
        navigate(`/verification-email?email=${encodeURIComponent(email)}`, { replace: true });
        return;
      }

      navigate(user.role === 'artisan' ? '/artisan' : '/compte', { replace: true });
    } catch (acceptError) {
      setError(errorMessage(acceptError, "La validation n'a pas abouti."));
    }
  };

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-800">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          {document.title}
        </p>

        {acceptMode && (
          <div className="mb-6">
            <Alert tone="amber">
              Avant de continuer, lisez attentivement le règlement ci-dessous, puis validez votre
              acceptation. Cette étape est obligatoire après l’inscription, conformément au Code du
              numérique en République du Bénin.
            </Alert>
          </div>
        )}

        <Card className="p-6 sm:p-10">
          <LegalDocument document={document} />

          <nav className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-sm">
            <p className="font-medium text-slate-900">Autres documents</p>
            <Link to="/mentions-legales" className="text-brand-700 hover:underline">
              Mentions légales
            </Link>
            <Link to={`/reglement/${otherAudience}`} className="text-brand-700 hover:underline">
              {otherAudience === 'artisan' ? 'Règlement artisans' : 'Règlement clients'}
            </Link>
          </nav>
        </Card>

        {acceptMode && (
          <Card className="sticky bottom-20 z-10 mt-6 border-brand-200 bg-white p-5 shadow-lg md:bottom-4">
            {error && (
              <div className="mb-4">
                <Alert>{error}</Alert>
              </div>
            )}
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
              />
              <span className="text-sm leading-relaxed text-slate-700">
                {document.acceptanceLabel}
              </span>
            </label>
            <Button
              type="button"
              size="lg"
              loading={isLoading}
              disabled={!accepted}
              className="mt-4 w-full"
              onClick={onValidate}
            >
              Valider et continuer
            </Button>
            <p className="mt-3 text-center text-xs text-slate-500">
              En validant, vous confirmez également avoir pris connaissance des{' '}
              <Link to="/mentions-legales" className="text-brand-700 hover:underline">
                mentions légales
              </Link>
              .
            </p>
          </Card>
        )}
      </div>
    </Container>
  );
}
