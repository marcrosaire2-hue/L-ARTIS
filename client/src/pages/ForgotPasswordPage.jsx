import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailCheck } from 'lucide-react';
import { useForgotPasswordMutation } from '../features/auth/auth.api';
import { Alert, Button, Card, Container, Field, Input } from '../components/ui';
import { errorMessage } from '../lib/format';

const schema = z.object({
  identifier: z.string().trim().min(1, 'Numéro de téléphone ou e-mail requis'),
});

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [sent, setSent] = useState(null);
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      // Le serveur répond toujours OK, même si l'adresse est inconnue
      // (anti-énumération) : l'écran de confirmation est donc identique.
      const result = await forgotPassword(values.identifier).unwrap();
      setSent({ devToken: result?.dev?.resetToken });
    } catch (error) {
      setFormError(errorMessage(error));
    }
  };

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-md">
        <Card className="p-6">
          {sent ? (
            <div className="text-center">
              <MailCheck className="mx-auto size-12 text-brand-600" aria-hidden="true" />
              <h1 className="mt-4 text-xl font-bold text-slate-900">Vérifiez votre boîte mail</h1>
              <p className="mt-2 text-slate-600">
                Si votre compte dispose d'une adresse e-mail, un lien de réinitialisation vient
                d'être envoyé. Sinon, contactez le support.
              </p>
              {sent.devToken && (
                <p className="mt-4 text-sm text-slate-500">
                  Environnement de développement —{' '}
                  <Link
                    to={`/reinitialiser-mot-de-passe?token=${sent.devToken}`}
                    className="font-medium text-brand-700 underline"
                  >
                    réinitialiser directement
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Mot de passe oublié</h1>
                <p className="mt-1 text-sm text-slate-600">
                  La réinitialisation passe par e-mail. Si vous n'en avez pas renseigné,
                  contactez le support : un administrateur réinitialisera votre mot de passe.
                </p>
              </div>

              {formError && <Alert>{formError}</Alert>}

              <Field
                label="Numéro de téléphone ou e-mail"
                error={errors.identifier?.message}
              >
                <Input autoComplete="username" placeholder="01 47 88 01 43" {...register('identifier')} />
              </Field>

              <Button type="submit" loading={isLoading}>
                Envoyer le lien
              </Button>

              <Link to="/connexion" className="text-center text-sm text-brand-700 hover:underline">
                Retour à la connexion
              </Link>
            </form>
          )}
        </Card>
      </div>
    </Container>
  );
}
