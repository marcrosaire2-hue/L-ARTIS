import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useResetPasswordMutation } from '../features/auth/auth.api';
import { Alert, Button, Card, Container, Field, Input } from '../components/ui';
import { errorMessage } from '../lib/format';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Au moins 8 caractères')
      .regex(/[a-z]/, 'Ajoutez une minuscule')
      .regex(/[A-Z]/, 'Ajoutez une majuscule')
      .regex(/\d/, 'Ajoutez un chiffre'),
    confirm: z.string(),
  })
  .refine((values) => values.newPassword === values.confirm, {
    path: ['confirm'],
    message: 'Les mots de passe ne correspondent pas',
  });

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      await resetPassword({ token, newPassword: values.newPassword }).unwrap();
      navigate('/connexion', { replace: true });
    } catch (error) {
      setFormError(errorMessage(error, 'Réinitialisation impossible.'));
    }
  };

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-md">
        <Card className="p-6">
          {!token ? (
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-900">Lien incomplet</h1>
              <p className="mt-2 text-slate-600">
                Ce lien ne contient pas de jeton. Ouvrez-le depuis l'e-mail reçu.
              </p>
              <Link to="/mot-de-passe-oublie" className="mt-4 inline-block">
                <Button variant="secondary">Demander un nouveau lien</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Nouveau mot de passe</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Toutes vos sessions ouvertes seront fermées.
                </p>
              </div>

              {formError && <Alert>{formError}</Alert>}

              <Field label="Nouveau mot de passe" error={errors.newPassword?.message}>
                <Input type="password" autoComplete="new-password" {...register('newPassword')} />
              </Field>

              <Field label="Confirmation" error={errors.confirm?.message}>
                <Input type="password" autoComplete="new-password" {...register('confirm')} />
              </Field>

              <Button type="submit" loading={isLoading}>
                Enregistrer
              </Button>
            </form>
          )}
        </Card>
      </div>
    </Container>
  );
}
