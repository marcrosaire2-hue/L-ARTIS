import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
  AlertBox,
  Badge,
  Button,
  Field,
  LoadingView,
  ScreenHeader,
  TextField,
} from '../../src/components/ui';
import {
  useGetQuoteQuery,
  useRespondToQuoteMutation,
  useUpdateQuoteStatusMutation,
} from '../../src/features/quotes/quotes.api';
import { selectUser } from '../../src/features/auth/authSlice';
import { errorMessage, formatPrice, timeAgo } from '../../src/lib/format';
import { colors, radius, spacing, typography } from '../../src/lib/theme';

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams();
  const quoteId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useSelector(selectUser);

  const { data: quote, isLoading, isError, error } = useGetQuoteQuery(quoteId, { skip: !quoteId });
  const [respond, { isLoading: responding }] = useRespondToQuoteMutation();
  const [updateStatus, { isLoading: updating }] = useUpdateQuoteStatusMutation();

  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState(null);

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LoadingView label="Chargement du devis…" />
      </View>
    );
  }

  if (isError || !quote) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Devis" onBack={() => router.back()} />
        <AlertBox>{errorMessage(error, 'Devis introuvable.')}</AlertBox>
      </View>
    );
  }

  const isArtisan = user?.role === 'artisan';
  const canRespond = isArtisan && quote.status === 'pending';
  const canComplete = !isArtisan && quote.status === 'accepted';

  const onRespond = async (status) => {
    setActionError(null);
    if (status === 'accepted' && (!price || Number(price) < 0)) {
      return setActionError('Indiquez un prix pour accepter le devis.');
    }
    try {
      await respond({
        id: quoteId,
        status,
        price: status === 'accepted' ? Number(price) : undefined,
        message: message.trim() || undefined,
      }).unwrap();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const onComplete = async () => {
    setActionError(null);
    try {
      await updateStatus({ id: quoteId, status: 'completed' }).unwrap();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
      }}
    >
      <ScreenHeader title="Détail du devis" onBack={() => router.back()} />

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.title}>{quote.title}</Text>
          <Badge label={quote.status} />
        </View>
        <Text style={typography.body}>{quote.description}</Text>
        <Text style={typography.small}>{timeAgo(quote.createdAt)}</Text>
        {quote.artisan?.displayName ? (
          <Text style={typography.small}>Artisan : {quote.artisan.displayName}</Text>
        ) : null}
        {quote.client?.firstName ? (
          <Text style={typography.small}>
            Client : {quote.client.firstName} {quote.client.lastName}
          </Text>
        ) : null}
        {quote.response?.price != null ? (
          <Text style={styles.price}>
            Proposition : {formatPrice(quote.response.price)}
            {quote.response.message ? `\n${quote.response.message}` : ''}
          </Text>
        ) : null}
      </View>

      {actionError ? <AlertBox>{actionError}</AlertBox> : null}

      {canRespond ? (
        <View style={styles.card}>
          <Text style={styles.section}>Répondre</Text>
          <Field label="Prix proposé (FCFA)">
            <TextField value={price} onChangeText={setPrice} keyboardType="number-pad" />
          </Field>
          <Field label="Message">
            <TextField value={message} onChangeText={setMessage} multiline />
          </Field>
          <Button label="Accepter" loading={responding} onPress={() => onRespond('accepted')} />
          <Button
            label="Refuser"
            variant="danger"
            loading={responding}
            onPress={() => onRespond('rejected')}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      ) : null}

      {canComplete ? (
        <Button
          label="Marquer comme terminé"
          loading={updating}
          onPress={onComplete}
          style={{ marginTop: spacing.md }}
        />
      ) : null}
    </ScrollView>
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
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  title: { ...typography.heading, fontSize: 18, flex: 1 },
  section: { fontWeight: '700', fontSize: 16 },
  price: { color: colors.brandDark, fontWeight: '700', marginTop: 4 },
});
