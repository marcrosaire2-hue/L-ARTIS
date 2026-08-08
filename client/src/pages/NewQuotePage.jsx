import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateQuoteMutation } from '../features/quotes/quotes.api';
import { useGetArtisanQuery } from '../features/artisans/artisans.api';
import {
  Alert,
  Button,
  Card,
  Container,
  Field,
  Input,
  Loading,
  Textarea,
} from '../components/ui';
import { errorMessage } from '../lib/format';

export default function NewQuotePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const artisanId = searchParams.get('artisanId') || '';
  const nameHint = searchParams.get('name') || '';

  const { data, isLoading: loadingArtisan } = useGetArtisanQuery(artisanId, {
    skip: !artisanId,
  });
  const [createQuote, { isLoading }] = useCreateQuoteMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState(null);

  const artisan = data?.artisan;
  const displayName = artisan?.displayName || nameHint || 'Artisan';

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (!artisanId) return setError('Artisan non spécifié.');
    if (title.trim().length < 3) return setError('Le titre doit contenir au moins 3 caractères.');
    if (description.trim().length < 10) {
      return setError('Décrivez votre besoin en au moins 10 caractères.');
    }

    try {
      const quote = await createQuote({
        artisanId: artisan._id,
        title: title.trim(),
        description: description.trim(),
        location: { commune: commune.trim(), address: address.trim() },
      }).unwrap();
      navigate(`/devis/${quote._id}`, { replace: true });
    } catch (submitError) {
      setError(errorMessage(submitError, "La demande n'a pas pu être envoyée."));
    }
  };

  if (!artisanId) {
    return (
      <Container className="py-16">
        <Alert>Artisan non spécifié. Retournez à la fiche d'un artisan pour demander un devis.</Alert>
        <Link to="/recherche" className="mt-4 inline-block text-brand-700 hover:underline">
          Rechercher un artisan
        </Link>
      </Container>
    );
  }

  if (loadingArtisan) return <Loading label="Chargement…" />;

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Demander un devis</h1>
        <p className="mt-1 text-slate-600">
          Pour <strong>{displayName}</strong>
        </p>

        <Card className="mt-6 p-6">
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            {error && <Alert>{error}</Alert>}

            <Field label="Objet de la demande" required>
              <Input
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Rénovation salle de bain"
              />
            </Field>

            <Field label="Description du besoin" required hint="Minimum 10 caractères">
              <Textarea
                rows={5}
                maxLength={3000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez les travaux, la surface, vos contraintes de délai…"
              />
            </Field>

            <Field label="Commune">
              <Input
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                placeholder="Ex. Cotonou"
              />
            </Field>

            <Field label="Adresse ou repère">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Quartier, rue, repère…"
              />
            </Field>

            <Button type="submit" size="lg" loading={isLoading}>
              Envoyer la demande
            </Button>
          </form>
        </Card>
      </div>
    </Container>
  );
}
