import { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertBox,
  Badge,
  Button,
  EmptyState,
  LoadingView,
  Rating,
  ScreenHeader,
  TextField,
} from '../../src/components/ui';
import { CatalogVisual } from '../../src/components/CatalogVisual';
import { useGetArtisanQuery } from '../../src/features/artisans/artisans.api';
import {
  useAddFavoriteMutation,
  useListFavoritesQuery,
  useRemoveFavoriteMutation,
} from '../../src/features/favorites/favorites.api';
import { useCreateReviewMutation } from '../../src/features/reviews/reviews.api';
import { selectUser } from '../../src/features/auth/authSlice';
import {
  PRICE_UNITS,
  errorMessage,
  formatPhone,
  formatPrice,
  initials,
  mediaUrl,
  timeAgo,
} from '../../src/lib/format';
import { colors, radius, spacing, typography } from '../../src/lib/theme';

function ContactActions({ artisan }) {
  const router = useRouter();
  const user = useSelector(selectUser);
  const phone = artisan.contactPhone;
  const whatsapp = (artisan.socialLinks?.whatsapp || phone || '').replace(/\D/g, '');

  const { data: favorites } = useListFavoritesQuery(
    { limit: 100 },
    { skip: user?.role !== 'client' }
  );
  const [addFavorite, { isLoading: addingFav }] = useAddFavoriteMutation();
  const [removeFavorite, { isLoading: removingFav }] = useRemoveFavoriteMutation();

  const isFavorite = (favorites?.items ?? []).some(
    (fav) => String(fav.artisan?._id || fav.artisan) === String(artisan._id)
  );

  const openTel = () => phone && Linking.openURL(`tel:${phone}`);
  const openWa = () => whatsapp && Linking.openURL(`https://wa.me/${whatsapp}`);

  const toggleFavorite = async () => {
    if (!user) return router.push('/connexion');
    if (user.role !== 'client') return;
    try {
      if (isFavorite) await removeFavorite(artisan._id).unwrap();
      else await addFavorite(artisan._id).unwrap();
    } catch {
      /* 409 déjà favori, etc. */
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Contacter cet artisan</Text>
      {phone ? (
        <>
          <Button label="Appeler" onPress={openTel} style={{ marginTop: spacing.sm }} />
          {whatsapp ? (
            <Button
              label="WhatsApp"
              variant="secondary"
              onPress={openWa}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
          <Pressable onPress={openTel}>
            <Text style={styles.phone}>{formatPhone(phone)}</Text>
          </Pressable>
        </>
      ) : (
        <Text style={typography.muted}>Numéro non renseigné.</Text>
      )}

      {user?.role !== 'artisan' ? (
        <>
          <Button
            label="Demander un devis"
            variant="secondary"
            onPress={() => {
              if (!user) return router.push('/connexion');
              router.push({
                pathname: '/devis/nouveau',
                params: { artisanId: artisan._id, name: artisan.displayName },
              });
            }}
            style={{ marginTop: spacing.sm }}
          />
          <Button
            label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            variant="secondary"
            loading={addingFav || removingFav}
            onPress={toggleFavorite}
            style={{ marginTop: spacing.sm }}
          />
        </>
      ) : null}

      {artisan.pricing?.fromPrice > 0 ? (
        <Text style={[typography.small, { marginTop: spacing.md }]}>
          Tarifs à partir de{' '}
          <Text style={{ fontWeight: '700', color: colors.text }}>
            {formatPrice(artisan.pricing.fromPrice)}
          </Text>{' '}
          {PRICE_UNITS[artisan.pricing.unit] ?? ''}
          {artisan.pricing.isFreeEstimate ? '\nDevis gratuit' : ''}
        </Text>
      ) : null}
    </View>
  );
}

function ReviewForm({ artisan }) {
  const user = useSelector(selectUser);
  const router = useRouter();
  const [createReview, { isLoading }] = useCreateReviewMutation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  if (!user) {
    return (
      <View style={styles.card}>
        <Text style={typography.body}>
          <Text style={styles.link} onPress={() => router.push('/connexion')}>
            Connectez-vous
          </Text>{' '}
          pour laisser un avis.
        </Text>
      </View>
    );
  }

  if (user.role !== 'client') return null;

  if (sent) {
    return (
      <View style={styles.card}>
        <AlertBox tone="green">Merci ! Votre avis est publié et visible sur cette fiche.</AlertBox>
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    if (!rating) return setError('Choisissez une note.');
    try {
      await createReview({ artisanId: artisan._id, rating, comment: comment.trim() }).unwrap();
      setSent(true);
    } catch (submitError) {
      setError(errorMessage(submitError, "Votre avis n'a pas pu être envoyé."));
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Donnez votre avis</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setRating(value)} accessibilityLabel={`${value} étoiles`}>
            <Text style={[styles.star, value <= rating && styles.starOn]}>
              {value <= rating ? '★' : '☆'}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextField
        value={comment}
        onChangeText={setComment}
        placeholder="Comment s'est passée la prestation ?"
        multiline
        maxLength={2000}
        style={{ marginTop: spacing.sm }}
      />
      {error ? <AlertBox>{error}</AlertBox> : null}
      <Button label="Publier mon avis" loading={isLoading} onPress={submit} style={{ marginTop: spacing.sm }} />
    </View>
  );
}

export default function ArtisanDetailScreen() {
  const { artisanId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const id = Array.isArray(artisanId) ? artisanId[0] : artisanId;

  const { data, isLoading, isError, error } = useGetArtisanQuery(id, { skip: !id });

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LoadingView label="Chargement de la fiche…" />
      </View>
    );
  }

  if (isError || !data) {
    const notFound = error?.status === 404;
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Fiche artisan" onBack={() => router.back()} />
        <EmptyState
          title={notFound ? "Cette fiche n'est pas disponible" : 'Chargement impossible'}
          description={
            notFound
              ? "L'artisan n'existe pas ou sa fiche n'est pas encore publiée."
              : 'Une erreur est survenue. Réessayez dans un instant.'
          }
          action={
            <Button label="Voir d'autres artisans" variant="secondary" onPress={() => router.push('/recherche')} />
          }
        />
      </View>
    );
  }

  const { artisan, services = [], reviews } = data;
  const cover = mediaUrl(artisan.coverPhoto);
  const photo = mediaUrl(artisan.profilePhoto);
  const location = [artisan.location?.district, artisan.location?.commune, artisan.location?.department]
    .filter(Boolean)
    .join(', ');
  const reviewItems = reviews?.items ?? reviews ?? [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: spacing.xxl, paddingTop: insets.top }}
    >
      <View style={styles.coverWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverFallback]} />
        )}
      </View>

      <View style={styles.pad}>
        <ScreenHeader title="Fiche artisan" onBack={() => router.back()} />

        <View style={styles.identity}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.initials}>{initials(artisan.displayName)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {artisan.displayName}
              {artisan.isVerified ? ' ✓' : ''}
            </Text>
            {artisan.tagline ? <Text style={typography.muted}>{artisan.tagline}</Text> : null}
            <View style={styles.metaRow}>
              <Rating value={artisan.rating?.average ?? 0} count={artisan.rating?.count ?? 0} />
              <Badge
                label={artisan.availability?.isAvailable ? 'Disponible' : 'Indisponible'}
                tone={artisan.availability?.isAvailable ? 'green' : 'slate'}
              />
            </View>
            {location ? <Text style={[typography.small, { marginTop: 6 }]}>{location}</Text> : null}
          </View>
        </View>

        <ContactActions artisan={artisan} />

        {artisan.trades?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Métiers</Text>
            <View style={styles.chips}>
              {artisan.trades.map((trade) => (
                <View key={trade._id ?? trade.name} style={styles.tradeChip}>
                  <CatalogVisual image={trade.image} icon={trade.icon} size={28} />
                  <Text style={styles.tradeChipText}>{trade.name}</Text>
                </View>
              ))}
              {(artisan.skills ?? []).map((skill) => (
                <Badge key={skill} label={skill} tone="slate" />
              ))}
            </View>
          </View>
        ) : null}

        {artisan.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Présentation</Text>
            <Text style={typography.body}>{artisan.bio}</Text>
            {artisan.yearsExperience > 0 ? (
              <Text style={[typography.small, { marginTop: spacing.sm }]}>
                {artisan.yearsExperience} an{artisan.yearsExperience > 1 ? 's' : ''} d'expérience
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Une seule section : la photo, ce qu'elle montre et ce que ça coûte.
            Séparer « galerie » et « prestations » obligeait le client à faire
            le rapprochement lui-même. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réalisations</Text>
          {services.length === 0 ? (
            <Text style={typography.muted}>Aucune réalisation publiée pour le moment.</Text>
          ) : (
            services.map((service) => {
              const photos = (service.media ?? []).map((m) => mediaUrl(m.url)).filter(Boolean);
              return (
                <View key={service._id} style={styles.service}>
                  {photos.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {photos.map((uri) => (
                        <Image key={uri} source={{ uri }} style={styles.galleryImg} />
                      ))}
                    </ScrollView>
                  ) : null}
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  {service.description ? (
                    <Text style={typography.small}>{service.description}</Text>
                  ) : null}
                  <Text style={styles.servicePrice}>
                    {service.price != null
                      ? `${formatPrice(service.price)} ${PRICE_UNITS[service.priceUnit] ?? ''}`
                      : 'Sur devis'}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avis</Text>
          <ReviewForm artisan={artisan} />
          {Array.isArray(reviewItems) && reviewItems.length > 0 ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              {reviewItems.map((review) => (
                <View key={review._id} style={styles.review}>
                  <View style={styles.reviewHead}>
                    <Rating value={review.rating} />
                    <Text style={typography.small}>{timeAgo(review.createdAt)}</Text>
                  </View>
                  {review.comment ? <Text style={typography.body}>{review.comment}</Text> : null}
                  {review.author?.firstName ? (
                    <Text style={typography.small}>
                      {review.author.firstName} {review.author.lastName?.[0] ? `${review.author.lastName[0]}.` : ''}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={[typography.muted, { marginTop: spacing.sm }]}>Pas encore d'avis.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  pad: { paddingHorizontal: spacing.lg, marginTop: -spacing.lg },
  coverWrap: { height: 160, backgroundColor: colors.navy },
  cover: { width: '100%', height: '100%' },
  coverFallback: { backgroundColor: colors.navy },
  identity: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.cream,
    marginTop: -36,
  },
  avatarFallback: {
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 28, fontWeight: '700', color: colors.brandDark },
  name: { ...typography.heading, fontSize: 22 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, alignItems: 'center' },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
  phone: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.text,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.heading, fontSize: 18, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingRight: 10,
    paddingLeft: 4,
    borderRadius: radius.full,
    backgroundColor: colors.brandSurface,
    borderWidth: 1,
    borderColor: 'rgba(0,176,80,0.2)',
  },
  tradeChipText: { fontSize: 13, fontWeight: '700', color: colors.brandDark },
  service: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  serviceTitle: { fontWeight: '700', color: colors.text },
  servicePrice: { marginTop: 4, color: colors.brandDark, fontWeight: '700' },
  galleryImg: {
    width: 160,
    height: 120,
    borderRadius: radius.md,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  stars: { flexDirection: 'row', gap: 4 },
  star: { fontSize: 32, color: colors.border },
  starOn: { color: colors.accent },
  link: { color: colors.brand, fontWeight: '700' },
  review: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
