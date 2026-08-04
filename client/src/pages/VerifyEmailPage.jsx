import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2 } from 'lucide-react';
import {
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from '../features/auth/auth.api';
import { selectUser, userUpdated } from '../features/auth/authSlice';
import { Alert, Button, Card, Container, Field, Input } from '../components/ui';
import { errorMessage } from '../lib/format';

function nextAfterVerify({ role, termsAcceptedAt, pending }) {
  if (pending) return '/attente-validation';
  if (!termsAcceptedAt) {
    return `/reglement/${role === 'artisan' ? 'artisan' : 'client'}?accept=1`;
  }
  return role === 'artisan' ? '/artisan' : '/';
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sessionUser = useSelector(selectUser);

  const emailFromQuery = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailFromQuery || sessionUser?.email || '');
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [done, setDone] = useState(null);
  const [nextPath, setNextPath] = useState('/');

  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [resend, { isLoading: resending }] = useResendVerificationMutation();

  useEffect(() => {
    if (!done) return undefined;
    const timer = setTimeout(() => navigate(nextPath, { replace: true }), done === 'pending' ? 2200 : 1200);
    return () => clearTimeout(timer);
  }, [done, nextPath, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) return setError('Saisissez les 6 chiffres du code.');
    if (!email.trim()) return setError("L'adresse e-mail est obligatoire.");

    try {
      const result = await verifyEmail({
        code: digits,
        email: email.trim().toLowerCase(),
      }).unwrap();
      const user = result?.user;
      if (user) dispatch(userUpdated(user));
      const pending =
        result?.pendingArtisanValidation === true ||
        (user?.role || sessionUser?.role) === 'artisan';
      const dest = nextAfterVerify({
        role: user?.role || sessionUser?.role,
        termsAcceptedAt: user?.termsAcceptedAt ?? sessionUser?.termsAcceptedAt,
        pending,
      });
      setNextPath(dest);
      setDone(pending ? 'pending' : 'ok');
    } catch (verifyError) {
      setError(errorMessage(verifyError, 'Code invalide ou expiré.'));
    }
  };

  const onResend = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) return setError("Indiquez l'adresse e-mail pour renvoyer le code.");
    try {
      await resend(email.trim().toLowerCase()).unwrap();
      setInfo('Un nouveau code a été envoyé. Vérifiez votre boîte mail.');
    } catch (resendError) {
      setError(errorMessage(resendError, "Impossible d'envoyer un nouveau code."));
    }
  };

  if (done === 'pending') {
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-md p-8 text-center">
          <CheckCircle2 className="mx-auto size-12 text-brand-600" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Merci de patienter</h1>
          <p className="mt-2 text-slate-600">
            Votre e-mail est confirmé. Notre équipe va valider votre profil artisan. Vous
            recevrez ensuite un e-mail de bienvenue.
          </p>
          <Button className="mt-6" onClick={() => navigate(nextPath, { replace: true })}>
            Continuer
          </Button>
        </Card>
      </Container>
    );
  }

  if (done === 'ok') {
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-md p-8 text-center">
          <CheckCircle2 className="mx-auto size-12 text-brand-600" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Adresse confirmée</h1>
          <p className="mt-2 text-slate-600">Votre e-mail est vérifié. Redirection en cours…</p>
          <Button className="mt-6" onClick={() => navigate(nextPath, { replace: true })}>
            Continuer
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold text-slate-900">Code reçu par e-mail</h1>
        <p className="mt-2 text-sm text-slate-600">
          Saisissez le code à 6 chiffres envoyé à votre adresse. Il expire dans 15 minutes.
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
          {error && <Alert>{error}</Alert>}
          {info && <Alert tone="green">{info}</Alert>}

          <Field label="Adresse e-mail" required>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field label="Code de vérification" required>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="tracking-[0.35em] text-center text-xl font-semibold"
            />
          </Field>

          <Button type="submit" loading={isLoading}>
            Vérifier
          </Button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2 text-sm">
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="font-medium text-brand-700 hover:underline disabled:opacity-50"
          >
            {resending ? 'Envoi…' : 'Renvoyer le code'}
          </button>
          <Link to="/" className="text-slate-500 hover:underline">
            Plus tard
          </Link>
        </div>
      </Card>
    </Container>
  );
}
