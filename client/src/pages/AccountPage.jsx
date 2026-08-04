import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  CreditCard,
  FileText,
  Hammer,
  Heart,
  KeyRound,
  Mail,
  MessageCircle,
  Phone,
  Scale,
} from 'lucide-react';
import { useChangePasswordMutation } from '../features/auth/auth.api';
import { selectUser } from '../features/auth/authSlice';
import { Alert, Badge, Button, Card, Container, Field, Input } from '../components/ui';
import DeleteAccount from '../components/DeleteAccount';
import { errorMessage, fullName, initials } from '../lib/format';

function AccountLink({ to, icon: Icon, title, description }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
    >
      <Icon className="size-5 shrink-0 text-brand-600" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{title}</p>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
    </Link>
  );
}

function ChangePasswordForm() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      return setError('Les deux mots de passe ne correspondent pas.');
    }
    if (newPassword.length < 8) {
      return setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(errorMessage(submitError, 'Modification impossible.'));
    }
  };

  return (
    <Card className="p-6">
      <p className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
        <KeyRound className="size-5 text-brand-600" aria-hidden="true" />
        Changer le mot de passe
      </p>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error && <Alert>{error}</Alert>}
        {success && (
          <Alert tone="green">
            Mot de passe modifié. Vous devrez vous reconnecter sur vos autres appareils.
          </Alert>
        )}
        <Field label="Mot de passe actuel" required>
          <Input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <Field label="Nouveau mot de passe" required>
          <Input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirmer le nouveau mot de passe" required>
          <Input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" loading={isLoading} className="self-start">
          Enregistrer
        </Button>
      </form>
    </Card>
  );
}

export default function AccountPage() {
  const user = useSelector(selectUser);
  const isArtisan = user?.role === 'artisan';
  const reglementPath = isArtisan ? '/reglement/artisan' : '/reglement/client';

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Mon compte</h1>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-800">
              {initials(user)}
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-slate-900">{fullName(user)}</p>
              <Badge tone={isArtisan ? 'green' : 'slate'}>
                {isArtisan ? 'Artisan' : 'Client'}
              </Badge>
            </div>
          </div>

          <dl className="mt-6 flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <dt className="sr-only">Adresse e-mail</dt>
              <dd className="text-slate-700">{user?.email}</dd>
              {!user?.isEmailVerified && <Badge tone="amber">Non vérifiée</Badge>}
            </div>
            {user?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                <dt className="sr-only">Téléphone</dt>
                <dd className="text-slate-700">{user.phone}</dd>
              </div>
            )}
          </dl>

          {!user?.isEmailVerified && (
            <div className="mt-6">
              <Alert tone="amber">
                <span className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  Votre adresse e-mail n'est pas encore confirmée.{' '}
                  <Link
                    to={`/verification-email?email=${encodeURIComponent(user?.email || '')}`}
                    className="font-medium underline"
                  >
                    Vérifier mon e-mail
                  </Link>
                </span>
              </Alert>
            </div>
          )}
        </Card>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <AccountLink to="/devis" icon={ClipboardList} title="Mes devis" />
          <AccountLink to="/messages" icon={MessageCircle} title="Messages" />
          <AccountLink to="/notifications" icon={Bell} title="Notifications" />
          {!isArtisan && (
            <AccountLink to="/favoris" icon={Heart} title="Mes favoris" />
          )}
          <AccountLink to={reglementPath} icon={Scale} title="Règlement d'utilisation" />
          <AccountLink to="/mentions-legales" icon={FileText} title="Mentions légales" />
          {isArtisan && (
            <AccountLink to="/abonnement" icon={CreditCard} title="Mon abonnement" />
          )}
        </div>

        <div className="mt-4">
          <ChangePasswordForm />
        </div>

        <div className="mt-4">
          <DeleteAccount role={user?.role} />
        </div>

        {isArtisan && (
          <Card className="mt-4 flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3">
              <Hammer className="size-5 text-brand-600" aria-hidden="true" />
              <div>
                <p className="font-medium text-slate-900">Ma fiche artisan</p>
                <p className="text-sm text-slate-500">Photos, présentation, prestations et devis.</p>
              </div>
            </div>
            <Link to="/artisan">
              <Button>Ouvrir mon espace</Button>
            </Link>
          </Card>
        )}
      </div>
    </Container>
  );
}
