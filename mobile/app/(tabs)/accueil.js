import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { ArtisanCard } from '../../src/components/ArtisanCard';
import { CatalogVisual } from '../../src/components/CatalogVisual';
import { Button, EmptyState } from '../../src/components/ui';
import { useSearchArtisansQuery } from '../../src/features/artisans/artisans.api';
import { useListCategoriesQuery, useListDepartmentsQuery } from '../../src/features/catalog/catalog.api';
import { selectUser } from '../../src/features/auth/authSlice';
import { getBeninDepartments } from '../../src/lib/beninGeography';
import { colors, radius, spacing, typography } from '../../src/lib/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useSelector(selectUser);
  const [q, setQ] = useState('');
  const [commune, setCommune] = useState('');

  const { data: categories, isLoading: loadingCats } = useListCategoriesQuery();
  const { data: departmentsFromApi } = useListDepartmentsQuery();
  const departments =
    Array.isArray(departmentsFromApi) && departmentsFromApi.length > 0
      ? departmentsFromApi
      : getBeninDepartments();
  const { data: featured, isLoading: loadingFeatured } = useSearchArtisansQuery({
    sort: 'rating',
    limit: 6,
  });

  const communes = departments.flatMap((d) => d.communes);
  const artisans = featured?.items ?? [];

  const goSearch = (extra = {}) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (commune) params.set('commune', commune);
    Object.entries(extra).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    router.push(query ? `/recherche?${query}` : '/recherche');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.brand}>L-ARTIS</Text>
      <Text style={styles.hello}>
        {user?.firstName ? `Bonjour ${user.firstName}` : 'Trouvez un artisan de confiance'}
      </Text>
      <Text style={styles.lead}>
        Maçons, électriciens, couturiers… des professionnels vérifiés partout au Bénin.
      </Text>

      <View style={styles.searchBox}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Plombier, couturier, mécanicien…"
          placeholderTextColor={colors.textLight}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={() => goSearch()}
        />
        {communes.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.communeRow}>
            <Pressable
              onPress={() => setCommune('')}
              style={[styles.chip, !commune && styles.chipActive]}
            >
              <Text style={[styles.chipText, !commune && styles.chipTextActive]}>Tout le Bénin</Text>
            </Pressable>
            {communes.slice(0, 12).map((name) => (
              <Pressable
                key={name}
                onPress={() => setCommune(name === commune ? '' : name)}
                style={[styles.chip, commune === name && styles.chipActive]}
              >
                <Text style={[styles.chipText, commune === name && styles.chipTextActive]}>
                  {name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <Button label="Rechercher" onPress={() => goSearch()} style={{ marginTop: spacing.sm }} />
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Explorer par métier</Text>
      </View>
      {loadingCats ? (
        <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.lg }} />
      ) : (
        <View style={styles.catGrid}>
          {(categories ?? []).map((category) => (
            <Pressable
              key={category._id}
              onPress={() => goSearch({ category: category._id })}
              style={({ pressed }) => [styles.catCard, pressed && { opacity: 0.9 }]}
            >
              <CatalogVisual image={category.image} icon={category.icon} size="md" />
              <Text style={styles.catName} numberOfLines={2}>
                {category.name}
              </Text>
              {category.tradeCount > 0 ? (
                <Text style={styles.catMeta}>{category.tradeCount} métiers</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Mieux notés</Text>
        <Pressable onPress={() => router.push('/recherche')}>
          <Text style={styles.sectionLink}>Voir tout</Text>
        </Pressable>
      </View>

      {loadingFeatured ? (
        <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.lg }} />
      ) : artisans.length === 0 ? (
        <EmptyState
          title="Les premiers artisans arrivent bientôt"
          description="Vous êtes artisan ? Complétez votre fiche pour apparaître ici."
        />
      ) : (
        <View style={styles.list}>
          {artisans.map((artisan) => (
            <ArtisanCard key={artisan._id} artisan={artisan} />
          ))}
        </View>
      )}

      {user?.role !== 'artisan' ? (
        <View style={styles.cta}>
          <Text style={styles.ctaTitle}>Vous êtes artisan ?</Text>
          <Text style={styles.ctaText}>
            Créez votre fiche, annoncez vos tarifs en FCFA et recevez des demandes près de chez vous.
          </Text>
          <Button
            label="Créer ma fiche artisan"
            variant="secondary"
            onPress={() => router.push({ pathname: '/inscription', params: { role: 'artisan' } })}
            style={{ marginTop: spacing.md }}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.6,
  },
  hello: { ...typography.heading, marginTop: spacing.xs },
  lead: { ...typography.muted, marginTop: spacing.xs, marginBottom: spacing.lg },
  searchBox: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  communeRow: { marginTop: spacing.sm, maxHeight: 40 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.brandSurface, borderColor: colors.brand },
  chipText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: colors.brandDark },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.heading },
  sectionLink: { ...typography.small, color: colors.brand, fontWeight: '700' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  catCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  catName: { ...typography.body, fontWeight: '700', fontSize: 15 },
  catMeta: { ...typography.small, marginTop: 0 },
  list: { gap: spacing.md, marginBottom: spacing.xl },
  cta: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  ctaTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  ctaText: { marginTop: spacing.sm, color: 'rgba(255,255,255,0.75)', lineHeight: 22 },
});
