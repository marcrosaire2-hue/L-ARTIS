import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Check,
  ClipboardList,
  Clock,
  CreditCard,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  XCircle,
} from 'lucide-react';
import {
  useCreateMyServiceMutation,
  useDeleteMyServiceMutation,
  useGetMyArtisanQuery,
  useListMyServicesQuery,
  useUpdateMyProfileMutation,
  useUploadMediaMutation,
} from '../features/artisans/artisans.api';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Field,
  Input,
  Loading,
  Select,
  Textarea,
} from '../components/ui';
import DeleteAccount from '../components/DeleteAccount';
import { PRICE_UNITS, errorMessage, formatPrice, mediaUrl } from '../lib/format';

/*
 * Espace artisan — centré sur la complétion tant que la fiche n'est pas
 * publiée. Afficher un tableau de bord à zéro à quelqu'un qui vient de
 * s'inscrire donne l'impression que le service ne fonctionne pas ; on lui
 * montre plutôt ce qui reste à faire pour devenir visible.
 * Chaque bloc s'enregistre indépendamment : un upload qui échoue ne fait
 * rien perdre du reste.
 */

function ImageUploader({ label, hint, currentUrl, aspect, onUploaded }) {
  const inputRef = useRef(null);
  const [uploadMedia, { isLoading }] = useUploadMediaMutation();
  const [error, setError] = useState(null);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const media = await uploadMedia(file).unwrap();
      // La galerie a besoin de l'id du Media, le profil seulement de l'URL
      await onUploaded(media.url, media);
    } catch (uploadError) {
      setError(errorMessage(uploadError, "L'envoi a échoué."));
    } finally {
      // Permet de re-sélectionner le même fichier après une erreur
      event.target.value = '';
    }
  };

  const preview = mediaUrl(currentUrl);

  return (
    <div>
      <div className={`overflow-hidden rounded-xl bg-slate-100 ${aspect}`}>
        {preview ? (
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-8 text-slate-300" aria-hidden="true" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
        aria-label={label}
      />
      <Button
        variant="secondary"
        size="sm"
        className="mt-3"
        loading={isLoading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" aria-hidden="true" />
        {preview ? 'Remplacer' : label}
      </Button>
      {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function StatusBanner({ artisan }) {
  if (artisan.status === 'rejected') {
    return (
      <Alert>
        <span className="flex items-start gap-2">
          <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>Votre fiche a été refusée.</strong>
            {artisan.rejectionReason && <span className="mt-1 block">{artisan.rejectionReason}</span>}
            <span className="mt-1 block">Corrigez les points signalés, elle sera réexaminée.</span>
          </span>
        </span>
      </Alert>
    );
  }

  if (artisan.status === 'suspended') {
    return <Alert>Votre fiche est suspendue. Contactez le support pour en savoir plus.</Alert>;
  }

  if (artisan.status === 'pending') {
    return (
      <Alert tone="amber">
        <span className="flex items-start gap-2">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Votre fiche est en attente de validation par notre équipe. Plus elle est complète, plus
          la validation est rapide.
        </span>
      </Alert>
    );
  }

  return (
    <Alert tone="green">
      <span className="flex items-center gap-2">
        <BadgeCheck className="size-4 shrink-0" aria-hidden="true" />
        Votre fiche est publiée et visible par les clients.
      </span>
    </Alert>
  );
}

function ChecklistItem({ done, optional, title, description, children }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
            done ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-400'
          }`}
        >
          <Check className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
            {title}
            {optional && <Badge tone="slate">Facultatif</Badge>}
          </p>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </Card>
  );
}

function PresentationForm({ artisan, onSave, saving }) {
  const [bio, setBio] = useState(artisan.bio ?? '');
  const [tagline, setTagline] = useState(artisan.tagline ?? '');
  const [years, setYears] = useState(artisan.yearsExperience ?? 0);
  const [saved, setSaved] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaved(false);
    await onSave({ bio, tagline, yearsExperience: Number(years) || 0 });
    setSaved(true);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Accroche" hint="Une phrase courte affichée sous votre nom.">
        <Input
          value={tagline}
          maxLength={120}
          onChange={(event) => setTagline(event.target.value)}
          placeholder="Menuisier ébéniste depuis 12 ans à Cotonou"
        />
      </Field>
      <Field label="Présentation" hint={`${bio.length}/2000 caractères`}>
        <Textarea
          rows={5}
          value={bio}
          maxLength={2000}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Décrivez votre parcours, vos spécialités, votre façon de travailler…"
        />
      </Field>
      <Field label="Années d'expérience" className="sm:w-48">
        <Input
          type="number"
          min="0"
          max="80"
          value={years}
          onChange={(event) => setYears(event.target.value)}
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving}>
          Enregistrer
        </Button>
        {saved && <span className="text-sm text-brand-700">Enregistré</span>}
      </div>
    </form>
  );
}

function LegalInfoForm({ artisan, onSave, saving }) {
  const [rccm, setRccm] = useState(artisan.legal?.rccm ?? '');
  const [ifu, setIfu] = useState(artisan.legal?.ifu ?? '');
  const [saved, setSaved] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaved(false);
    await onSave({ legal: { rccm: rccm.trim(), ifu: ifu.trim() } });
    setSaved(true);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Numéro RCCM" hint="Registre du Commerce et du Crédit Mobilier">
        <Input
          value={rccm}
          maxLength={60}
          onChange={(event) => setRccm(event.target.value)}
          placeholder="RB/COT/XX XX XXXXX"
        />
      </Field>
      <Field label="Identifiant Fiscal Unique (IFU)">
        <Input
          value={ifu}
          maxLength={40}
          onChange={(event) => setIfu(event.target.value)}
          placeholder="IFU"
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving}>
          Enregistrer
        </Button>
        {saved && <span className="text-sm text-brand-700">Enregistré</span>}
      </div>
    </form>
  );
}

function RealisationsForm() {
  const { data: services } = useListMyServicesQuery();
  const [createService, { isLoading }] = useCreateMyServiceMutation();
  const [deleteService] = useDeleteMyServiceMutation();
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();
  const photoInput = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    priceUnit: 'forfait',
    durationMin: '',
  });
  const [error, setError] = useState(null);

  const list = services ?? [];

  const addPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const media = await uploadMedia(file).unwrap();
      setPhotos((current) => [...current, { id: media.id, url: media.url }]);
    } catch (uploadError) {
      setError(errorMessage(uploadError, "L'envoi de la photo a échoué."));
    } finally {
      event.target.value = '';
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (photos.length === 0) {
      setError('Ajoutez au moins une photo : c’est ce que le client regarde en premier.');
      return;
    }
    try {
      await createService({
        title: form.title,
        description: form.description,
        // Prix vide = « sur devis ». On n'envoie pas 0, qui signifierait gratuit.
        ...(String(form.price).trim() ? { price: Number(form.price) } : {}),
        priceUnit: form.priceUnit,
        ...(String(form.durationMin).trim() ? { durationMin: Number(form.durationMin) } : {}),
        media: photos.map((photo) => photo.id),
      }).unwrap();
      setForm({ title: '', description: '', price: '', priceUnit: 'forfait', durationMin: '' });
      setPhotos([]);
    } catch (createError) {
      setError(errorMessage(createError, "La réalisation n'a pas pu être publiée."));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {list.length > 0 && (
        <ul className="flex flex-col gap-2">
          {list.map((service) => (
            <li
              key={service._id}
              className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
            >
              {service.media?.[0]?.url ? (
                <img
                  src={mediaUrl(service.media[0].url)}
                  alt=""
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="size-16 shrink-0 rounded-lg bg-slate-200" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-slate-900">{service.title}</span>
                <span className="text-sm text-slate-500">
                  {service.price != null
                    ? `${formatPrice(service.price)} ${PRICE_UNITS[service.priceUnit] ?? ''}`
                    : 'Sur devis'}
                  {service.media?.length > 1 ? ` · ${service.media.length} photos` : ''}
                </span>
              </span>
              <button
                type="button"
                onClick={() => deleteService(service._id).unwrap().catch(() => {})}
                className="shrink-0 text-sm font-medium text-red-600 hover:underline"
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Photos<span className="ml-0.5 text-red-600">*</span>
          </span>
          <div className="flex flex-wrap gap-3">
            {photos.map((photo) => (
              <span key={photo.id} className="relative">
                <img src={mediaUrl(photo.url)} alt="" className="size-24 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((current) => current.filter((p) => p.id !== photo.id))}
                  className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white"
                  aria-label="Retirer cette photo"
                >
                  ✕
                </button>
              </span>
            ))}
            {photos.length < 10 && (
              <>
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={addPhoto}
                  className="hidden"
                  aria-label="Ajouter une photo"
                />
                <button
                  type="button"
                  onClick={() => photoInput.current?.click()}
                  disabled={uploading}
                  className="flex size-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50"
                >
                  <ImageIcon className="size-5" aria-hidden="true" />
                  <span className="text-xs">{uploading ? 'Envoi…' : 'Ajouter'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <Field label="Nom de la réalisation" required>
          <Input
            value={form.title}
            required
            minLength={3}
            maxLength={100}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Braids Butterfly, Table en bois massif…"
          />
        </Field>
        <Field label="Description">
          <Textarea
            rows={2}
            value={form.description}
            maxLength={2000}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prix (FCFA)" hint="Facultatif — vide = sur devis.">
            <Input
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
            />
          </Field>
          <Field label="Unité">
            <Select
              value={form.priceUnit}
              onChange={(event) => setForm({ ...form, priceUnit: event.target.value })}
            >
              {Object.entries(PRICE_UNITS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Durée de réalisation (minutes)" hint="Facultatif.">
          <Input
            type="number"
            min="5"
            value={form.durationMin}
            onChange={(event) => setForm({ ...form, durationMin: event.target.value })}
            className="sm:w-48"
          />
        </Field>
        <Button type="submit" variant="secondary" loading={isLoading}>
          {list.length ? 'Ajouter cette réalisation' : 'Publier ma première réalisation'}
        </Button>
      </form>
    </div>
  );
}

export default function ArtisanSpacePage() {
  const { data, isLoading, isError, error } = useGetMyArtisanQuery();
  const { data: services } = useListMyServicesQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();

  if (isLoading) return <Loading label="Chargement de votre fiche…" />;
  if (isError) {
    return (
      <Container className="py-16">
        <Alert>{errorMessage(error)}</Alert>
      </Container>
    );
  }

  const artisan = data.artisan;
  const serviceCount = (services ?? []).length;

  const steps = [
    { key: 'photo', done: Boolean(artisan.profilePhoto) },
    { key: 'bio', done: Boolean(artisan.bio?.trim()) },
    { key: 'service', done: serviceCount > 0 },
  ];
  const completed = steps.filter((step) => step.done).length;
  const readyToSubmit = completed === steps.length;
  const isPublished = artisan.status === 'validated';

  const saveProfile = (patch) => updateProfile(patch).unwrap().catch(() => {});

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{artisan.displayName}</h1>
          <p className="mt-1 text-slate-600">Votre espace artisan</p>
        </div>
        {isPublished && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/artisans/${artisan.artisanId}`}>
              <Button variant="secondary" size="sm">
                <ExternalLink className="size-4" aria-hidden="true" />
                Voir ma fiche publique
              </Button>
            </Link>
            <Link to="/abonnement">
              <Button variant="secondary" size="sm">
                <CreditCard className="size-4" aria-hidden="true" />
                Mon abonnement
              </Button>
            </Link>
          </div>
        )}
        {!isPublished && (
          <Link to="/abonnement">
            <Button variant="secondary" size="sm">
              <CreditCard className="size-4" aria-hidden="true" />
              Mon abonnement
            </Button>
          </Link>
        )}
      </div>

      <div className="mb-6">
        <StatusBanner artisan={artisan} />
      </div>

      {!isPublished && (
        <Card className="mb-6 p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="font-semibold text-slate-900">
              <ClipboardList className="mr-2 inline size-5 text-brand-600" aria-hidden="true" />
              Complétez votre fiche
            </p>
            <span className="text-sm font-medium text-slate-600">
              {completed} / {steps.length}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${(completed / steps.length) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {readyToSubmit
              ? 'Tout est prêt. Notre équipe examinera votre fiche très prochainement.'
              : 'Une fiche complète est validée plus vite et inspire davantage confiance.'}
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        <ChecklistItem
          done={Boolean(artisan.profilePhoto)}
          title="Photo de profil"
          description="Un visage ou votre logo : c'est le premier élément de confiance."
        >
          <ImageUploader
            label="Ajouter une photo"
            aspect="size-32"
            currentUrl={artisan.profilePhoto}
            onUploaded={(url) => saveProfile({ profilePhoto: url })}
          />
        </ChecklistItem>

        <ChecklistItem
          done={Boolean(artisan.bio?.trim())}
          title="Présentation"
          description="Expliquez qui vous êtes et ce que vous savez faire."
        >
          <PresentationForm artisan={artisan} onSave={saveProfile} saving={isSaving} />
        </ChecklistItem>

        <ChecklistItem
          done={serviceCount > 0}
          title="Vos prestations"
          description="Annoncez au moins un tarif : les clients filtrent beaucoup par prix."
        >
          <RealisationsForm />
        </ChecklistItem>

        <ChecklistItem
          done={Boolean(artisan.legal?.rccm?.trim() || artisan.legal?.ifu?.trim())}
          optional
          title="Informations légales"
          description="RCCM et IFU — utiles pour la confiance et la conformité."
        >
          <LegalInfoForm artisan={artisan} onSave={saveProfile} saving={isSaving} />
        </ChecklistItem>

        <ChecklistItem
          done={Boolean(artisan.coverPhoto)}
          optional
          title="Photo de couverture"
          description="Une image large en haut de votre fiche — un chantier, votre atelier."
        >
          <ImageUploader
            label="Ajouter une couverture"
            aspect="aspect-[3/1] w-full max-w-md"
            currentUrl={artisan.coverPhoto}
            onUploaded={(url) => saveProfile({ coverPhoto: url })}
          />
        </ChecklistItem>

      </div>

      <div className="mt-10">
        <DeleteAccount role="artisan" />
      </div>
    </Container>
  );
}
