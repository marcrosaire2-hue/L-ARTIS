import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useDeleteAccountMutation } from '../features/auth/auth.api';
import { sessionEnded } from '../features/auth/authSlice';
import { Alert, Button, Card, Field, Input } from './ui';
import { errorMessage } from '../lib/format';

/**
 * Suppression du compte par son titulaire.
 *
 * Le mot de passe est redemandé : l'action est irréversible et une session
 * laissée ouverte sur un téléphone prêté ne doit pas suffire à effacer le
 * compte de quelqu'un. La confirmation se fait en deux temps délibérément —
 * dérouler le bloc, puis saisir le mot de passe — pour qu'aucun clic isolé
 * ne puisse déclencher la suppression.
 */
export default function DeleteAccount({ role }) {
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await deleteAccount(password).unwrap();
      dispatch(sessionEnded());
      navigate('/', { replace: true });
    } catch (deleteError) {
      setError(errorMessage(deleteError, "La suppression n'a pas abouti."));
    }
  };

  return (
    <Card className="border-red-200 p-6 ring-red-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">Supprimer mon compte</p>
          <p className="mt-1 text-sm text-slate-600">
            {role === 'artisan'
              ? 'Votre fiche, vos prestations, vos photos et vos avis seront définitivement effacés. Vous disparaîtrez des résultats de recherche.'
              : 'Votre compte, vos favoris et les avis que vous avez publiés seront définitivement effacés.'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Cette action est irréversible. Votre numéro redeviendra disponible : vous pourrez
            créer un nouveau compte plus tard avec le même.
          </p>

          {!open ? (
            <Button variant="secondary" className="mt-4" onClick={() => setOpen(true)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Supprimer mon compte
            </Button>
          ) : (
            <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
              <Field
                label="Confirmez avec votre mot de passe"
                error={error}
                className="max-w-sm"
              >
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="danger" loading={isLoading}>
                  Supprimer définitivement
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setOpen(false);
                    setPassword('');
                    setError(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {error && !open && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}
    </Card>
  );
}
