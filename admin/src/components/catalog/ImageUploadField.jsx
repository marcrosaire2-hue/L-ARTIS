import { useRef, useState } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { useUploadMediaMutation } from '../../features/uploads/uploads.api';
import { Button, Field } from '../ui';
import ImagePreview from './ImagePreview';
import { errorMessage } from '../../lib/format';

/* Formats acceptés par l'API d'upload (JPEG, PNG, WebP, GIF). */
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

/**
 * Champ "Image de la catégorie" : sélection, aperçu immédiat, envoi vers
 * l'API (Cloudinary), remplacement et retrait. `onChange` n'est appelé
 * qu'avec l'URL finale renvoyée par le serveur.
 */
export default function ImageUploadField({ label, value, onChange, hint, error }) {
  const inputRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [preview, setPreview] = useState(value ?? '');
  const [uploadMedia, { isLoading }] = useUploadMediaMutation();
  const [uploadError, setUploadError] = useState(null);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadError(null);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreview(objectUrl);

    try {
      const media = await uploadMedia(file).unwrap();
      setPreview(media.url);
      onChange(media.url);
    } catch (err) {
      setPreview(value ?? '');
      setUploadError(errorMessage(err, "L'image n'a pas pu être envoyée."));
    } finally {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    }
  };

  const handleRemove = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setPreview('');
    setUploadError(null);
    onChange('');
  };

  return (
    <Field label={label} hint={hint} error={error}>
      <div className="flex flex-wrap items-center gap-4">
        <ImagePreview image={preview} />

        <div className="flex flex-col items-start gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={handleFile}
            aria-label={label ?? 'Choisir une image'}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            {isLoading ? 'Envoi en cours…' : 'Choisir une image'}
          </Button>
          {preview && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleRemove}
              aria-label="Retirer l'image"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Retirer
            </Button>
          )}
          {uploadError && (
            <p role="alert" className="text-xs text-red-600">
              {uploadError}
            </p>
          )}
        </div>
      </div>
    </Field>
  );
}
