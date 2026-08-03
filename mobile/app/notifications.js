import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
  AlertBox,
  Button,
  EmptyState,
  LoadingView,
  ScreenHeader,
} from '../src/components/ui';
import {
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../src/features/notifications/notifications.api';
import { selectUser } from '../src/features/auth/authSlice';
import { errorMessage, timeAgo } from '../src/lib/format';
import { colors, radius, spacing, typography } from '../src/lib/theme';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useSelector(selectUser);

  const { data, isLoading, isError, error, refetch } = useListNotificationsQuery(
    { limit: 50 },
    { skip: !user }
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  if (!user) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Notifications" onBack={() => router.back()} />
        <AlertBox tone="amber">Connectez-vous pour voir vos notifications.</AlertBox>
      </View>
    );
  }

  const items = data?.items ?? [];
  const unread = data?.unreadCount ?? 0;

  const openItem = async (item) => {
    if (!item.readAt) {
      try {
        await markRead(item._id).unwrap();
      } catch {
        /* ignore */
      }
    }
    if (item.data?.quoteId) {
      router.push(`/devis/${item.data.quoteId}`);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <ScreenHeader
          title="Notifications"
          subtitle={unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'À jour'}
          onBack={() => router.back()}
          right={
            unread > 0 ? (
              <Pressable onPress={() => markAll()} disabled={markingAll}>
                <Text style={styles.markAll}>Tout lire</Text>
              </Pressable>
            ) : null
          }
        />
      </View>

      {isLoading ? (
        <LoadingView />
      ) : isError ? (
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <AlertBox>{errorMessage(error)}</AlertBox>
          <Button label="Réessayer" variant="secondary" onPress={refetch} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <EmptyState title="Aucune notification" description="Les alertes devis et validations apparaîtront ici." />
          }
          renderItem={({ item }) => {
            const unreadItem = !item.readAt;
            return (
              <Pressable
                onPress={() => openItem(item)}
                style={({ pressed }) => [
                  styles.card,
                  unreadItem && styles.cardUnread,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <Text style={styles.title}>{item.title}</Text>
                {item.message ? <Text style={typography.small}>{item.message}</Text> : null}
                <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  markAll: { color: colors.brand, fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  cardUnread: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSurface,
  },
  title: { fontWeight: '700', color: colors.text, fontSize: 15 },
  time: { ...typography.small, marginTop: 4 },
});
