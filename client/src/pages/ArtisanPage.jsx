import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BadgeCheck, Clock, Images, MapPin, MessageCircle, Phone, Star, UserX } from 'lucide-react';
import { useGetArtisanQuery } from '../features/artisans/artisans.api';
import { useCreateReviewMutation } from '../features/reviews/reviews.api';
import { selectUser } from '../features/auth/authSlice';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  LinkButton,
  Loading,
  Rating,
  Textarea,
} from '../components/ui';
import {
  PRICE_UNITS,
  errorMessage,
  formatPhone,
  formatPrice,
  fullName,
  initials,
  mediaUrl,
  timeAgo,
} from '../lib/format';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function Header({ artisan }) {
  const cover = mediaUrl(artisan.coverPhoto);
  const photo = mediaUrl(artisan.profilePhoto);
  const location = [artisan.location?.district, artisan.location?.commune, artisan.location?.department]
    .filter(Boolean)
    .join(', ');

  return (
    <div>
      <div className="h-40 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 sm:h-56">
        {cover && <img src={cover} alt="" className="size-full object-cover" />}
      </div>

      <div className="-mt-12 flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:px-8">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="size-24 rounded-2xl object-cover ring-4 ring-white sm:size-32"
          />
        ) : (
          <span className="flex size-24 items-center justify-center rounded-2xl bg-brand-100 text-3xl font-semibold text-brand-800 ring-4 ring-white sm:size-32">
            {initials(artisan.displayName)}
          </span>
        )}

        <div className="min-w-0 flex-1 pb-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            {artisan.displayName}
            {artisan.isVerified && (
              <BadgeCheck className="size-5 text-brand-600" aria-label="Profil vérifié" />
            )}
          </h1>
          {artisan.tagline && <p className="mt-0.5 text-slate-600">{artisan.tagline}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Rating
              value={artisan.rating?.average ?? 0}
              count={artisan.rating?.count ?? 0}
              size="lg"
            />
            {location && (
              <span className="flex items-center gap-1 text-sm text-slate-600">
                <MapPin className="size-4" aria-hidden="true" />
                {location}
              </span>
            )}
            <Badge tone={artisan.availability?.isAvailable ? 'green' : 'slate'}>
              {artisan.availability?.isAvailable ? 'Disponible' : 'Indisponible'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Appel direct et WhatsApp, les deux canaux réels au Bénin.
 *
 * Ce sont de vrais liens (`<a>`), pas des boutons habillés en liens : un
 * <button> imbriqué dans un <a> est du HTML invalide, il intercepte le clic
 * et le lien `tel:` ne se déclenche jamais — c'est ce qui faisait que le
 * bouton « Appeler » ne réagissait pas.
 *
 * wa.me exige le numéro en chiffres, sans « + » ni séparateurs.
 */
function ContactActions({ artisan }) {
  const phone = artisan.contactPhone;
  const whatsapp = (artisan.socialLinks?.whatsapp || phone || '').replace(/\D/g, '');

  return (
    <Card className="p-5">
      <p className="font-semibold text-slate-900">Contacter cet artisan</p>
      <div className="mt-4 flex flex-col gap-2">
        {phone ? (
          <>
            <LinkButton href={`tel:${phone}`} size="lg" className="w-full">
              <Phone className="size-5" aria-hidden="true" />
              Appeler
            </LinkButton>

            {whatsapp && (
              <LinkButton
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                size="lg"
                className="w-full"
              >
                <MessageCircle className="size-5 text-[#25D366]" aria-hidden="true" />
                WhatsApp
              </LinkButton>
            )}

            <a
              href={`tel:${phone}`}
              className="mt-1 text-center font-mono text-lg tracking-wide text-slate-900 hover:text-brand-700"
            >
              {formatPhone(phone)}
            </a>
          </>
        ) : (
          <p className="text-sm text-slate-500">Numéro non renseigné.</p>
        )}
      </div>
      {artisan.pricing?.fromPrice > 0 && (
        <p className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600">
          Tarifs à partir de{' '}
          <strong className="text-slate-900">{formatPrice(artisan.pricing.fromPrice)}</strong>{' '}
          {PRICE_UNITS[artisan.pricing.unit] ?? ''}
          {artisan.pricing.isFreeEstimate && (
            <span className="mt-1 block text-brand-700">Devis gratuit</span>
          )}
        </p>
      )}
    </Card>
  );
}

/**
 * Dépôt d'un avis : étoiles cliquables + commentaire.
 * L'avis part en modération (statut `pending` côté serveur) : il n'apparaît
 * qu'une fois validé par un administrateur, ce que le message de confirmation
 * annonce clairement pour éviter que l'auteur ne le croie perdu.
 */
function ReviewForm({ artisan }) {
  const user = useSelector(selectUser);
  const [createReview, { isLoading }] = useCreateReviewMutation();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  if (!user) {
    return (
      <Card className="p-5">
        <p className="text-slate-700">
          <Link to="/connexion" className="font-medium text-brand-700 hover:underline">
            Connectez-vous
          </Link>{' '}
          pour laisser un avis sur cet artisan.
        </p>
      </Card>
    );
  }

  if (user.role !== 'client') return null;

  if (sent) {
    return (
      <Card className="p-5">
        <Alert tone="green">
          Merci ! Votre avis est publié et visible sur cette fiche.
        </Alert>
      </Card>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (!rating) return setError('Choisissez une note en cliquant sur les étoiles.');
    try {
      await createReview({ artisanId: artisan._id, rating, comment: comment.trim() }).unwrap();
      setSent(true);
    } catch (submitError) {
      setError(errorMessage(submitError, "Votre avis n'a pas pu être envoyé."));
    }
  };

  const shown = hovered || rating;

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="font-semibold text-slate-900">Donnez votre avis</p>

        <div>
          <span className="mb-1.5 block text-sm text-slate-600">Votre note</span>
          <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHovered(value)}
                aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
                aria-pressed={rating === value}
                className="rounded p-0.5"
              >
                <Star
                  className={`size-8 transition-colors ${
                    value <= shown ? 'fill-accent-400 text-accent-400' : 'text-slate-300'
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm text-slate-600">Votre commentaire</span>
          <Textarea
            rows={4}
            value={comment}
            maxLength={2000}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Comment s'est passée la prestation ? Délais, qualité, tarif…"
          />
        </label>

        {error && <Alert>{error}</Alert>}

        <Button type="submit" loading={isLoading} className="self-start">
          Publier mon avis
        </Button>
      </form>
    </Card>
  );
}

function WorkHours({ hours }) {
  if (!hours?.length) return null;
  return (
    <Card className="p-5">
      <p className="flex items-center gap-2 font-semibold text-slate-900">
        <Clock className="size-4 text-slate-400" aria-hidden="true" />
        Horaires
      </p>
      <dl className="mt-3 flex flex-col gap-1.5 text-sm">
        {hours.map((slot) => (
          <div key={slot.day} className="flex justify-between gap-4">
            <dt className="text-slate-600">{DAYS[slot.day]}</dt>
            <dd className="text-slate-900">
              {slot.isClosed ? 'Fermé' : `${slot.open} – ${slot.close}`}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default function ArtisanPage() {
  const { artisanId } = useParams();
  const { data, isLoading, isError, error } = useGetArtisanQuery(artisanId);

  if (isLoading) return <Loading label="Chargement de la fiche…" />;

  if (isError) {
    const notFound = error?.status === 404;
    return (
      <Container className="py-16">
        <EmptyState
          icon={UserX}
          title={notFound ? 'Cette fiche n’est pas disponible' : 'Chargement impossible'}
          description={
            notFound
              ? "L'artisan n'existe pas ou sa fiche n'est pas encore publiée."
              : "Une erreur est survenue. Réessayez dans un instant."
          }
          action={
            <Link to="/recherche" className="mt-2">
              <Button variant="secondary">Voir d'autres artisans</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  const { artisan, gallery = [], services = [], reviews } = data;

  return (
    <Container className="py-6">
      <Header artisan={artisan} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-8">
          {artisan.trades?.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Métiers</h2>
              <div className="flex flex-wrap gap-2">
                {artisan.trades.map((trade) => (
                  <Badge key={trade._id ?? trade.name} tone="green">
                    {trade.name}
                  </Badge>
                ))}
                {artisan.skills?.map((skill) => (
                  <Badge key={skill} tone="slate">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {artisan.bio && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Présentation</h2>
              <p className="whitespace-pre-line text-slate-700">{artisan.bio}</p>
              {artisan.yearsExperience > 0 && (
                <p className="mt-3 text-sm text-slate-500">
                  {artisan.yearsExperience} an{artisan.yearsExperience > 1 ? 's' : ''} d'expérience
                </p>
              )}
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Prestations</h2>
            {services.length === 0 ? (
              <p className="text-slate-500">Aucune prestation publiée pour le moment.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((service) => (
                  <Card key={service._id} className="p-4">
                    <p className="font-medium text-slate-900">{service.title}</p>
                    {service.description && (
                      <p className="mt-1 text-sm text-slate-600">{service.description}</p>
                    )}
                    <p className="mt-3 font-semibold text-brand-700">
                      {formatPrice(service.price)}{' '}
                      <span className="text-sm font-normal text-slate-500">
                        {PRICE_UNITS[service.priceUnit] ?? ''}
                      </span>
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Images className="size-5 text-slate-400" aria-hidden="true" />
              Réalisations
            </h2>
            {gallery.length === 0 ? (
              <p className="text-slate-500">Aucune photo publiée pour le moment.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((item) => (
                  <figure key={item.id} className="overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={mediaUrl(item.url)}
                      alt={item.caption || ''}
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  </figure>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Star className="size-5 text-slate-400" aria-hidden="true" />
              Avis clients
              {reviews?.total > 0 && (
                <span className="text-base font-normal text-slate-500">({reviews.total})</span>
              )}
            </h2>
            <div className="mb-4">
              <ReviewForm artisan={artisan} />
            </div>

            {!reviews?.items?.length ? (
              <p className="text-slate-500">Aucun avis pour le moment. Soyez le premier.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.items.map((review) => (
                  <Card key={review._id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">
                        {fullName(review.client?.[0] ?? review.client)}
                      </p>
                      <Rating value={review.rating} />
                    </div>
                    <p className="mt-2 text-slate-700">{review.comment}</p>
                    <p className="mt-2 text-xs text-slate-400">{timeAgo(review.createdAt)}</p>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <ContactActions artisan={artisan} />
          <WorkHours hours={artisan.workHours} />
          {artisan.availability?.note && (
            <Alert tone="amber">{artisan.availability.note}</Alert>
          )}
        </aside>
      </div>
    </Container>
  );
}
