import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLoginMutation } from '../features/auth/auth.api';
import { credentialsReceived, selectIsAuthenticated, selectUser } from '../features/auth/authSlice';
import { Alert, Button, Card, Container, Field, Input } from '../components/ui';
import { errorMessage } from '../lib/format';

// L'identifiant est le numéro de téléphone ; l'e-mail reste accepté pour les
// comptes qui en ont renseigné un. Le serveur distingue les deux.
const schema = z.object({
  identifier: z.string().trim().min(1, 'Numéro de téléphone requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  // Une seule source de vérité pour la destination : `credentialsReceived`
  // rend `isAuthenticated` vrai et déclenche la redirection ci-dessous avant
  // qu'un navigate() posé dans le gestionnaire de soumission ne s'exécute —
  // deux destinations différentes et c'est la mauvaise qui gagne.
  const redirectTo =
    location.state?.from?.pathname ?? (user?.role === 'artisan' ? '/artisan' : '/');

  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      dispatch(credentialsReceived(await login(values).unwrap()));
    } catch (error) {
      setFormError(errorMessage(error, 'Connexion impossible.'));
    }
  };

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Connexion</h1>
          <p className="mt-1 text-slate-600">Connectez-vous avec votre numéro de téléphone.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {formError && <Alert>{formError}</Alert>}

            <Field
              label="Numéro de téléphone"
              error={errors.identifier?.message}
              hint="Vous pouvez aussi utiliser votre e-mail si vous en avez renseigné un."
            >
              <Input
                type="tel"
                autoComplete="username"
                placeholder="01 47 88 01 43"
                {...register('identifier')}
              />
            </Field>

            <Field label="Mot de passe" error={errors.password?.message}>
              <Input type="password" autoComplete="current-password" {...register('password')} />
            </Field>

            <Link
              to="/mot-de-passe-oublie"
              className="-mt-1 self-end text-sm text-brand-700 hover:underline"
            >
              Mot de passe oublié ?
            </Link>

            <Button type="submit" size="lg" loading={isLoading}>
              Se connecter
            </Button>

            <p className="text-center text-sm text-slate-600">
              Pas encore de compte ?{' '}
              <Link to="/inscription" className="font-medium text-brand-700 hover:underline">
                S'inscrire
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </Container>
  );
}
