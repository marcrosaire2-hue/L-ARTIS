import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2 } from 'lucide-react';
import { useAcceptTermsMutation } from '../features/auth/auth.api';
import { selectUser, userUpdated } from '../features/auth/authSlice';
import { Alert, Button, Card, Container } from '../components/ui';
import { REGLEMENT_ARTISAN } from '../lib/legal/reglementArtisan';
import { REGLEMENT_CLIENT } from '../lib/legal/reglementClient';
import { errorMessage } from '../lib/format';

const DOCS = {
  client: REGLEMENT_CLIENT,
  artisan: REGLEMENT_ARTISAN,
};

export default function ReglementPage() {
  const { audience: audienceParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const acceptMode = searchParams.get('accept') === '1';
  const emailHint = searchParams.get('email') || '';

  const audience =
    audienceParam === 'artisan' || audienceParam === 'client'
      ? audienceParam
      : user?.role === 'artisan'
        ? 'artisan'
        : 'client';

  const doc = DOCS[audience];
  const [acceptTerms, { isLoading }] = useAcceptTermsMutation();
  const [error, setError] = useState(null);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    setError(null);
    try {
      const result = await acceptTerms().unwrap();
      if (result?.user) dispatch(userUpdated(result.user));
      setAccepted(true);
      const verifyUrl = emailHint
        ? `/verification-email?email=${encodeURIComponent(emailHint)}`
        : '/compte';
      setTimeout(() => navigate(verifyUrl, { replace: true }), 1200);
    } catch (acceptError) {
      setError(errorMessage(acceptError, "L'acceptation a échoué."));
    }
  };

  if (accepted) {
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-md p-8 text-center">
          <CheckCircle2 className="mx-auto size-12 text-brand-600" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Règlement accepté</h1>
          <p className="mt-2 text-slate-600">Merci. Redirection en cours…</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{doc.title}</h1>
        <p className="mt-2 text-sm text-slate-500">Version {doc.version}</p>

        {acceptMode && (
          <div className="mt-6">
            <Alert tone="amber">
              Pour continuer à utiliser L-ARTIS, veuillez lire et accepter le règlement ci-dessous.
            </Alert>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-6">
          {doc.sections.map((section) => (
            <Card key={section.heading} className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mt-3 text-slate-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </Card>
          ))}
        </div>

        {error && (
          <div className="mt-6">
            <Alert>{error}</Alert>
          </div>
        )}

        {acceptMode ? (
          <div className="mt-8 flex flex-col items-center gap-4">
            <Button size="lg" loading={isLoading} onClick={handleAccept}>
              J'accepte le règlement
            </Button>
            <p className="text-center text-xs text-slate-500">
              En cliquant, vous confirmez avoir lu et accepté la version {doc.version} du
              règlement, conformément à la loi n° 2017-20 portant Code du numérique.
            </p>
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-slate-500">
            <Link to="/mentions-legales" className="font-medium text-brand-700 hover:underline">
              Mentions légales
            </Link>
            {' · '}
            <Link to="/" className="font-medium text-brand-700 hover:underline">
              Accueil
            </Link>
          </p>
        )}
      </article>
    </Container>
  );
}
