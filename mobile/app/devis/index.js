import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
  AlertBox,
  Badge,
  EmptyState,
  LoadingView,
  ScreenHeader,
} from '../../src/components/ui';
import {
  useListArtisanQuotesQuery,
  useListMyQuotesQuery,
} from '../../src/features/quotes/quotes.api';
import { selectUser } from '../../src/features/auth/authSlice';
import { errorMessage, formatPrice, timeAgo } from '../../src/lib/format';
import { colors, radius, spacing, typography } from '../../src/lib/theme';

const STATUS_LABEL = {
  pending: 'En attente',
  accepted: 'Accepté',
  rejected: 'Refusé',
  completed: 'Terminé',
};

const STATUS_TONE = {
  pending: 'amber',
  accepted: 'green',
  rejected: 'slate',
  completed: 'green',
};

export default function QuotesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useSelector(selectUser);
  const isArtisan = user?.role === 'artisan';

  const clientQuery = useListMyQuotesQuery({ limit: 50 }, { skip: !user || isArtisan });
  const artisanQuery = useListArtisanQuotesQuery({ limit: 50 }, { skip: !isArtisan });
  const { data, isLoading, isError, error } = isArtisan ? artisanQuery : clientQuery;

  const items = data?.items ?? [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <ScreenHeader
          title={isArtisan ? 'Devis reçus' : 'Mes devis'}
          subtitle={isArtisan ? 'Demandes de vos clients' : 'Vos demandes envoyées'}
          onBack={() => router.back()}
        />
      </View>

      {isLoading ? (
        <LoadingView />
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
              title="Aucun devis"
              description={
                isArtisan
                  ? 'Les demandes de clients apparaîtront ici.'
                  : 'Demandez un devis depuis la fiche d’un artisan.'
              }
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/devis/${item._id}`)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
            >
              <View style={styles.row}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Badge label={STATUS_LABEL[item.status] || item.status} tone={STATUS_TONE[item.status] || 'slate'} />
              </View>
              <Text style={typography.small} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={typography.small}>
                {isArtisan
                  ? [item.client?.firstName, item.client?.lastName].filter(Boolean).join(' ')
                  : item.artisan?.displayName}
                {item.createdAt ? ` · ${timeAgo(item.createdAt)}` : ''}
              </Text>
              {item.response?.price != null ? (
                <Text style={styles.price}>{formatPrice(item.response.price)}</Text>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  title: { ...typography.body, fontWeight: '700', flex: 1 },
  price: { color: colors.brandDark, fontWeight: '700', marginTop: 4 },
});
