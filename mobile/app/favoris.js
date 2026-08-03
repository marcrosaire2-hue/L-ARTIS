import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { ArtisanCard } from '../src/components/ArtisanCard';
import { AlertBox, EmptyState, LoadingView, ScreenHeader } from '../src/components/ui';
import { useListFavoritesQuery } from '../src/features/favorites/favorites.api';
import { selectUser } from '../src/features/auth/authSlice';
import { errorMessage } from '../src/lib/format';
import { colors, spacing, typography } from '../src/lib/theme';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useSelector(selectUser);
  const { data, isLoading, isError, error } = useListFavoritesQuery(
    { limit: 50 },
    { skip: user?.role !== 'client' }
  );

  if (user?.role !== 'client') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Favoris" onBack={() => router.back()} />
        <AlertBox tone="amber">Les favoris sont réservés aux comptes clients.</AlertBox>
      </View>
    );
  }

  const items = (data?.items ?? []).map((fav) => fav.artisan).filter(Boolean);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <ScreenHeader
          title="Mes favoris"
          subtitle={data ? `${items.length} artisan${items.length > 1 ? 's' : ''}` : undefined}
          onBack={() => router.back()}
        />
      </View>

      {isLoading ? (
        <LoadingView label="Chargement des favoris…" />
      ) : isError ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <AlertBox>{errorMessage(error)}</AlertBox>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <EmptyState
              title="Aucun favori"
              description="Ajoutez un artisan depuis sa fiche pour le retrouver ici."
            />
          }
          renderItem={({ item }) => <ArtisanCard artisan={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
});
