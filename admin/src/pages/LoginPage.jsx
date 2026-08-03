import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { credentialsReceived, selectIsAuthenticated } from '../features/auth/authSlice';
import { useLoginMutation, useLogoutMutation } from '../features/auth/auth.api';
import { Button, Card, Field, Input } from '../components/ui';
import { errorMessage } from '../lib/format';

const schema = z.object({
  identifier: z.string().trim().min(1, 'Identifiant requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [login, { isLoading }] = useLoginMutation();
  const [logout] = useLogoutMutation();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { identifier: '', password: '' } });

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname ?? '/'} replace />;
  }

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const session = await login(values).unwrap();

      // Le serveur authentifie tous les rôles sur ce même endpoint : c'est
      // ici qu'on refuse l'entrée aux comptes non administrateurs, en
      // révoquant au passage la session que le serveur vient d'ouvrir.
      if (session.user?.role !== 'admin') {
        await logout().catch(() => {});
        setFormError("Ce compte n'a pas accès à l'administration.");
        return;
      }

      dispatch(credentialsReceived(session));
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (error) {
      setFormError(errorMessage(error, 'Connexion impossible.'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex size-16 items-center justify-center rounded-panel bg-white p-1.5 shadow-lg shadow-black/30 ring-1 ring-inset ring-white/10">
            <img src="/logo.png" alt="L-ARTIS" className="h-full w-full object-contain" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Administration</h1>
            <p className="mt-1 text-sm text-slate-400">L-ARTIS — Bénin</p>
          </div>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {formError && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {formError}
              </p>
            )}

            <Field label="Identifiant" error={errors.identifier?.message}>
              <Input
                autoComplete="username"
                placeholder="01 47 88 01 43 ou admin@exemple.bj"
                aria-invalid={Boolean(errors.identifier)}
                {...register('identifier')}
              />
            </Field>

            <Field label="Mot de passe" error={errors.password?.message}>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
            </Field>

            <Button type="submit" loading={isLoading} className="mt-1 w-full">
              Se connecter
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-500">
          Accès réservé aux administrateurs de la plateforme.
        </p>
      </div>
    </div>
  );
}
