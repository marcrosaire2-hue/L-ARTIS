import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
  AlertBox,
  Button,
  LoadingView,
  ScreenHeader,
  TextField,
} from '../../src/components/ui';
import {
  useGetConversationQuery,
  useListMessagesQuery,
  useSendMessageMutation,
} from '../../src/features/conversations/conversations.api';
import { selectUser } from '../../src/features/auth/authSlice';
import { errorMessage, fullName, timeAgo } from '../../src/lib/format';
import { colors, radius, spacing, typography } from '../../src/lib/theme';

export default function ConversationThreadScreen() {
  const { id } = useLocalSearchParams();
  const conversationId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useSelector(selectUser);
  const listRef = useRef(null);

  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState(null);

  const { data: conversation, isLoading: loadingConv, isError: convError, error: convErr } =
    useGetConversationQuery(conversationId, { skip: !conversationId || !user });

  const { data: messagesData, isLoading: loadingMsgs, refetch } = useListMessagesQuery(
    { id: conversationId, limit: 50 },
    { skip: !conversationId || !user, pollingInterval: 15000 }
  );

  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

  const messages = messagesData?.items ?? [];

  const scrollToEnd = useCallback(() => {
    if (messages.length) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToEnd();
  }, [messages.length, scrollToEnd]);

  const onSend = async () => {
    const content = draft.trim();
    if (!content) return;
    setSendError(null);
    try {
      await sendMessage({ id: conversationId, content }).unwrap();
      setDraft('');
      refetch();
    } catch (err) {
      setSendError(errorMessage(err, "L'envoi a échoué."));
    }
  };

  if (!user) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Conversation" onBack={() => router.back()} />
        <AlertBox tone="amber">Connectez-vous pour lire cette conversation.</AlertBox>
      </View>
    );
  }

  if (loadingConv || loadingMsgs) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LoadingView label="Chargement de la conversation…" />
      </View>
    );
  }

  if (convError || !conversation) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Conversation" onBack={() => router.back()} />
        <AlertBox>{errorMessage(convErr, 'Conversation introuvable.')}</AlertBox>
      </View>
    );
  }

  const title =
    fullName(conversation.otherParticipant) ||
    conversation.artisan?.displayName ||
    'Conversation';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <ScreenHeader title={title} onBack={() => router.back()} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messages}
        onContentSizeChange={scrollToEnd}
        renderItem={({ item }) => {
          const mine = String(item.sender?._id || item.sender) === String(user._id);
          return (
            <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapOther]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.content}</Text>
                <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                  {timeAgo(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={[typography.muted, { textAlign: 'center', marginTop: spacing.lg }]}>
            Aucun message. Envoyez le premier !
          </Text>
        }
      />

      <View style={[styles.composer, { paddingBottom: insets.bottom + spacing.sm }]}>
        {sendError ? <AlertBox>{sendError}</AlertBox> : null}
        <View style={styles.composerRow}>
          <TextField
            value={draft}
            onChangeText={setDraft}
            placeholder="Votre message…"
            multiline
            maxLength={4000}
            style={styles.input}
          />
          <Pressable
            onPress={onSend}
            disabled={sending || !draft.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              (sending || !draft.trim()) && styles.sendBtnDisabled,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.sendLabel}>{sending ? '…' : 'Envoyer'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: spacing.lg },
  messages: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexGrow: 1 },
  bubbleWrap: { marginBottom: spacing.sm, maxWidth: '85%' },
  bubbleWrapMine: { alignSelf: 'flex-end' },
  bubbleWrapOther: { alignSelf: 'flex-start' },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: { backgroundColor: colors.brand },
  bubbleOther: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  bubbleText: { ...typography.body, color: colors.text },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: { ...typography.small, marginTop: 4, color: colors.textMuted },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.75)' },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: { flex: 1, maxHeight: 120 },
  sendBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendLabel: { color: '#fff', fontWeight: '700' },
});
