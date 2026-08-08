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
} from '../../src/components/ui';
import { useListConversationsQuery } from '../../src/features/conversations/conversations.api';
import { selectUser } from '../../src/features/auth/authSlice';
import { errorMessage, fullName, timeAgo } from '../../src/lib/format';
import { colors, radius, spacing, typography } from '../../src/lib/theme';

function conversationTitle(conversation) {
  const other = conversation.otherParticipant;
  if (other?.firstName) return fullName(other);
  return conversation.artisan?.displayName ?? 'Conversation';
}

function lastPreview(conversation) {
  const msg = conversation.lastMessage;
  if (!msg) return 'Aucun message';
  const text = typeof msg === 'object' ? msg.content : '';
  return text?.slice(0, 80) || 'Message';
}

export default function ConversationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useSelector(selectUser);

  const { data, isLoading, isError, error, refetch } = useListConversationsQuery(
    { limit: 50 },
    { skip: !user }
  );

  if (!user) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Messages" onBack={() => router.back()} />
        <AlertBox tone="amber">Connectez-vous pour accéder à vos messages.</AlertBox>
        <Button label="Se connecter" onPress={() => router.push('/connexion')} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  if (!user.termsAcceptedAt) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Messages" onBack={() => router.back()} />
        <AlertBox tone="amber">
          Acceptez le règlement d'utilisation pour accéder à la messagerie.
        </AlertBox>
        <Button
          label="Voir le règlement"
          onPress={() =>
            router.push({
              pathname: '/reglement',
              params: { accept: '1', audience: user.role === 'artisan' ? 'artisan' : 'client' },
            })
          }
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  const items = data?.items ?? [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <ScreenHeader title="Messages" subtitle="Vos conversations" onBack={() => router.back()} />
      </View>

      {isLoading ? (
        <LoadingView label="Chargement…" />
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
            <EmptyState
              title="Aucune conversation"
              description="Contactez un artisan depuis sa fiche pour démarrer un échange."
            />
          }
          renderItem={({ item }) => {
            const unread = item.unreadCount > 0;
            return (
              <Pressable
                onPress={() => router.push(`/messages/${item._id}`)}
                style={({ pressed }) => [
                  styles.card,
                  unread && styles.cardUnread,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <View style={styles.row}>
                  <Text style={styles.title}>{conversationTitle(item)}</Text>
                  {unread ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unreadCount}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.preview} numberOfLines={2}>
                  {lastPreview(item)}
                </Text>
                <Text style={styles.time}>{timeAgo(item.lastMessageAt || item.updatedAt)}</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontWeight: '700', color: colors.text, fontSize: 15, flex: 1 },
  preview: { ...typography.small, color: colors.textMuted },
  time: { ...typography.small, marginTop: 4 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
