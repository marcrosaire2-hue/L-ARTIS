import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArtisanCard } from '../../src/components/ArtisanCard';
import {
  AlertBox,
  Button,
  EmptyState,
  SelectField,
  TextField,
} from '../../src/components/ui';
import { useSearchArtisansQuery } from '../../src/features/artisans/artisans.api';
import {
  useListCategoriesQuery,
  useListDepartmentsQuery,
  useListTradesQuery,
} from '../../src/features/catalog/catalog.api';
import { cleanParams, errorMessage } from '../../src/lib/format';
import { colors, radius, spacing, typography } from '../../src/lib/theme';

function useInitialFilters(params) {
  return {
    q: typeof params.q === 'string' ? params.q : '',
    category: typeof params.category === 'string' ? params.category : '',
    trade: typeof params.trade === 'string' ? params.trade : '',
    department: typeof params.department === 'string' ? params.department : '',
    commune: typeof params.commune === 'string' ? params.commune : '',
    minRating: typeof params.minRating === 'string' ? params.minRating : '',
    isAvailable: typeof params.isAvailable === 'string' ? params.isAvailable : '',
    sort: typeof params.sort === 'string' ? params.sort : 'rating',
  };
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const initial = useInitialFilters(params);

  const [filters, setFilters] = useState(initial);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [qDraft, setQDraft] = useState(initial.q);

  // Re-sync when navigating from home with new query params
  const paramKey = `${params.q}|${params.category}|${params.commune}|${params.department}`;
  useEffect(() => {
    const next = useInitialFilters(params);
    setFilters(next);
    setQDraft(next.q);
    setPage(1);
  }, [paramKey]);

  const update = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const { data: categories } = useListCategoriesQuery();
  const { data: departments } = useListDepartmentsQuery();
  const { data: trades } = useListTradesQuery(
    { categoryId: filters.category },
    { skip: !filters.category }
  );

  const { data, isLoading, isFetching, isError, error } = useSearchArtisansQuery(
    cleanParams({ ...filters, page })
  );

  const communes =
    (departments ?? []).find((d) => d.department === filters.department)?.communes ?? [];

  const artisans = data?.items ?? [];

  const applySearch = () => {
    update({ q: qDraft.trim() });
    setDrawerOpen(false);
  };

  const FiltersForm = (
    <View>
      <Text style={styles.filterLabel}>Recherche</Text>
      <TextField
        value={qDraft}
        onChangeText={setQDraft}
        placeholder="Métier, compétence…"
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={applySearch}
      />

      <SelectField
        label="Catégorie"
        value={filters.category}
        onChange={(category) => update({ category, trade: '' })}
        placeholder="Toutes les catégories"
        options={[
          { value: '', label: 'Toutes les catégories' },
          ...(categories ?? []).map((c) => ({ value: c._id, label: c.name })),
        ]}
      />

      {filters.category ? (
        <SelectField
          label="Métier"
          value={filters.trade}
          onChange={(trade) => update({ trade })}
          placeholder="Tous les métiers"
          options={[
            { value: '', label: 'Tous les métiers' },
            ...(trades?.items ?? []).map((t) => ({ value: t._id, label: t.name })),
          ]}
        />
      ) : null}

      <SelectField
        label="Département"
        value={filters.department}
        onChange={(department) => update({ department, commune: '' })}
        placeholder="Tout le Bénin"
        options={[
          { value: '', label: 'Tout le Bénin' },
          ...(departments ?? []).map((d) => ({ value: d.department, label: d.department })),
        ]}
      />

      {communes.length > 0 ? (
        <SelectField
          label="Commune"
          value={filters.commune}
          onChange={(commune) => update({ commune })}
          placeholder="Toutes les communes"
          options={[
            { value: '', label: 'Toutes les communes' },
            ...communes.map((c) => ({ value: c, label: c })),
          ]}
        />
      ) : null}

      <SelectField
        label="Note minimale"
        value={filters.minRating}
        onChange={(minRating) => update({ minRating })}
        placeholder="Toutes les notes"
        options={[
          { value: '', label: 'Toutes les notes' },
          { value: '4', label: '4 étoiles et plus' },
          { value: '3', label: '3 étoiles et plus' },
        ]}
      />

      <Pressable
        onPress={() => update({ isAvailable: filters.isAvailable === 'true' ? '' : 'true' })}
        style={styles.checkRow}
      >
        <View style={[styles.checkbox, filters.isAvailable === 'true' && styles.checkboxOn]}>
          {filters.isAvailable === 'true' ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
        <Text style={typography.body}>Disponible actuellement</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={typography.heading}>Trouver un artisan</Text>
          {data ? (
            <Text style={typography.small}>
              {data.totalItems} artisan{data.totalItems > 1 ? 's' : ''}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={() => setDrawerOpen(true)} style={styles.filterBtn}>
          <Text style={styles.filterBtnText}>Filtres</Text>
        </Pressable>
      </View>

      <SelectField
        label="Trier"
        value={filters.sort}
        onChange={(sort) => update({ sort })}
        options={[
          { value: 'rating', label: 'Mieux notés' },
          { value: 'price', label: 'Prix croissant' },
          { value: 'newest', label: 'Plus récents' },
        ]}
      />

      {isLoading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : isError ? (
        <AlertBox>{errorMessage(error)}</AlertBox>
      ) : (
        <FlatList
          data={artisans}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.md }}
          style={{ flex: 1, opacity: isFetching ? 0.65 : 1 }}
          ListEmptyComponent={
            <EmptyState
              title="Aucun artisan trouvé"
              description="Élargissez la zone ou retirez certains filtres."
            />
          }
          renderItem={({ item }) => <ArtisanCard artisan={item} />}
          ListFooterComponent={
            data?.totalPages > 1 ? (
              <View style={styles.pager}>
                <Button
                  label="Précédent"
                  variant="secondary"
                  disabled={!data.hasPrevPage}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ flex: 1 }}
                />
                <Text style={styles.pageLabel}>
                  {data.page} / {data.totalPages}
                </Text>
                <Button
                  label="Suivant"
                  variant="secondary"
                  disabled={!data.hasNextPage}
                  onPress={() => setPage((p) => p + 1)}
                  style={{ flex: 1 }}
                />
              </View>
            ) : null
          }
        />
      )}

      <Modal visible={drawerOpen} animationType="slide" onRequestClose={() => setDrawerOpen(false)}>
        <View style={[styles.drawer, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.drawerHead}>
            <Text style={typography.heading}>Filtres</Text>
            <Pressable onPress={() => setDrawerOpen(false)}>
              <Text style={styles.close}>Fermer</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">{FiltersForm}</ScrollView>
          <Button label="Voir les résultats" onPress={applySearch} style={{ marginTop: spacing.md }} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.lg },
  top: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.sm },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterBtnText: { fontWeight: '700', color: colors.text, fontSize: 13 },
  filterLabel: { ...typography.small, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkMark: { color: '#fff', fontWeight: '700', fontSize: 12 },
  pager: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  pageLabel: { ...typography.small, minWidth: 48, textAlign: 'center' },
  drawer: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  drawerHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  close: { color: colors.brand, fontWeight: '700' },
});
