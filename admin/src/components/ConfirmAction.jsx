import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button, Field, Modal, Textarea } from './ui';

/**
 * Confirmation d'une action de modération, avec motif facultatif ou requis.
 *
 * `action` : { title, description, confirmLabel, variant, reason: 'none'
 * | 'optional' | 'required', reasonLabel, reasonHint }
 */
export default function ConfirmAction({ action, onClose, onConfirm, loading, error }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  // Réinitialise le motif à chaque nouvelle action ouverte
  useEffect(() => {
    setReason('');
    setTouched(false);
  }, [action]);

  if (!action) return null;

  const mode = action.reason ?? 'none';
  const missingReason = mode === 'required' && reason.trim().length === 0;

  const handleConfirm = () => {
    setTouched(true);
    if (missingReason) return;
    onConfirm(reason.trim());
  };

  return (
    <Modal open onClose={onClose} title={action.title} description={action.description}>
      <div className="flex flex-col gap-4">
        {mode !== 'none' && (
          <Field
            label={action.reasonLabel ?? 'Motif'}
            hint={action.reasonHint ?? (mode === 'optional' ? 'Facultatif' : undefined)}
            error={touched && missingReason ? 'Un motif est requis.' : undefined}
          >
            <Textarea
              rows={3}
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ce message sera envoyé à la personne concernée."
            />
          </Field>
        )}

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button variant={action.variant ?? 'primary'} onClick={handleConfirm} loading={loading}>
            {action.confirmLabel ?? 'Confirmer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
