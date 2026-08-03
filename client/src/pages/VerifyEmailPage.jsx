import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useVerifyEmailMutation } from '../features/auth/auth.api';
import { Button, Card, Container, Loading } from '../components/ui';
import { errorMessage } from '../lib/format';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [verifyEmail] = useVerifyEmailMutation();
  const [state, setState] = useState(token ? 'pending' : 'missing');
  const [message, setMessage] = useState(null);
  // Le token est à usage unique : le double montage de StrictMode ferait
  // échouer la seconde tentative et afficherait une erreur à tort.
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    verifyEmail(token)
      .unwrap()
      .then(() => setState('success'))
      .catch((error) => {
        setMessage(errorMessage(error, 'Lien invalide ou expiré.'));
        setState('error');
      });
  }, [token, verifyEmail]);

  if (state === 'pending') return <Loading label="Vérification en cours…" />;

  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-md p-8 text-center">
        {state === 'success' ? (
          <>
            <CheckCircle2 className="mx-auto size-12 text-brand-600" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Adresse confirmée</h1>
            <p className="mt-2 text-slate-600">
              Votre compte est actif. Vous pouvez maintenant vous connecter.
            </p>
            <Link to="/connexion" className="mt-6 inline-block">
              <Button>Se connecter</Button>
            </Link>
          </>
        ) : (
          <>
            <XCircle className="mx-auto size-12 text-red-500" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">
              {state === 'missing' ? 'Lien incomplet' : 'Vérification impossible'}
            </h1>
            <p className="mt-2 text-slate-600">
              {state === 'missing'
                ? "Ce lien ne contient pas de jeton de vérification. Ouvrez-le depuis l'e-mail reçu."
                : message}
            </p>
            <Link to="/" className="mt-6 inline-block">
              <Button variant="secondary">Retour à l'accueil</Button>
            </Link>
          </>
        )}
      </Card>
    </Container>
  );
}
