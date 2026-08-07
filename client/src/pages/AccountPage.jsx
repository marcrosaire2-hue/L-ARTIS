import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertTriangle, Hammer, Mail, Phone } from 'lucide-react';
import { selectUser } from '../features/auth/authSlice';
import { Alert, Badge, Button, Card, Container } from '../components/ui';
import DeleteAccount from '../components/DeleteAccount';
import { fullName, initials } from '../lib/format';

export default function AccountPage() {
  const user = useSelector(selectUser);

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
              <Badge tone={user?.role === 'artisan' ? 'green' : 'slate'}>
                {user?.role === 'artisan' ? 'Artisan' : 'Client'}
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

          <nav className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm">
            <Link to="/mentions-legales" className="text-brand-700 hover:underline">
              Mentions légales
            </Link>
            <Link
              to={`/reglement/${user?.role === 'artisan' ? 'artisan' : 'client'}`}
              className="text-brand-700 hover:underline"
            >
              Règlement {user?.role === 'artisan' ? 'artisans' : 'clients'}
            </Link>
          </nav>

          {!user?.isEmailVerified && (
            <div className="mt-6">
              <Alert tone="amber">
                <span className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  Votre adresse e-mail n'est pas encore confirmée. Ouvrez le lien reçu par e-mail
                  pour activer toutes les fonctionnalités.
                </span>
              </Alert>
            </div>
          )}
        </Card>

        <div className="mt-4">
          <DeleteAccount role={user?.role} />
        </div>

        {user?.role === 'artisan' && (
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
