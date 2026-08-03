import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatPrice, initials, mediaUrl, PRICE_UNITS } from '../lib/format';
import { colors, radius, spacing, typography } from '../lib/theme';
import { Badge, Rating } from './ui';

export function ArtisanCard({ artisan }) {
  const router = useRouter();
  const photo = mediaUrl(artisan.profilePhoto);
  const trades = artisan.trades ?? [];
  const commune = artisan.location?.commune;
  const unavailable = artisan.availability?.isAvailable === false;

  return (
    <Pressable
      onPress={() => router.push(`/artisans/${artisan.artisanId}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Voir la fiche de ${artisan.displayName}`}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={styles.photo} />
      ) : (
        <View style={styles.photoFallback}>
          <Text style={styles.initials}>{initials(artisan.displayName)}</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {artisan.displayName}
            {artisan.isVerified ? ' ✓' : ''}
          </Text>
          {unavailable ? <Badge label="Indisponible" tone="slate" /> : null}
        </View>

        {artisan.tagline ? (
          <Text style={styles.tagline} numberOfLines={1}>
            {artisan.tagline}
          </Text>
        ) : null}

        {trades.length > 0 ? (
          <View style={styles.trades}>
            {trades.slice(0, 3).map((trade) => (
              <Badge key={trade.id ?? trade._id ?? trade.name} label={trade.name} tone="green" />
            ))}
          </View>
        ) : null}

        <View style={styles.meta}>
          <Rating value={artisan.rating?.average ?? 0} count={artisan.rating?.count ?? 0} />
          {commune ? <Text style={styles.metaText}>{commune}</Text> : null}
          {artisan.pricing?.fromPrice > 0 ? (
            <Text style={styles.metaText}>
              dès {formatPrice(artisan.pricing.fromPrice)}{' '}
              {PRICE_UNITS[artisan.pricing.unit] ?? ''}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  photo: { width: 72, height: 72, borderRadius: radius.md },
  photoFallback: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 20, fontWeight: '700', color: colors.brandDark },
  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  name: { ...typography.body, fontWeight: '700', flex: 1 },
  tagline: { ...typography.small, marginTop: 2 },
  trades: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' },
  metaText: { ...typography.small, color: colors.textMuted },
});
