import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
  AlertBox,
  Button,
  Field,
  ScreenHeader,
  TextField,
} from '../../src/components/ui';
import { useCreateQuoteMutation } from '../../src/features/quotes/quotes.api';
import { selectUser } from '../../src/features/auth/authSlice';
import { errorMessage } from '../../src/lib/format';
import { colors, spacing, typography } from '../../src/lib/theme';

export default function NewQuoteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useSelector(selectUser);
  const params = useLocalSearchParams();
  const artisanId = typeof params.artisanId === 'string' ? params.artisanId : params.artisanId?.[0];
  const artisanName =
    typeof params.name === 'string' ? params.name : params.name?.[0] || 'cet artisan';

  const [createQuote, { isLoading }] = useCreateQuoteMutation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  if (user?.role !== 'client') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Demande de devis" onBack={() => router.back()} />
        <AlertBox tone="amber">Connectez-vous avec un compte client pour demander un devis.</AlertBox>
      </View>
    );
  }

  if (!artisanId) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Demande de devis" onBack={() => router.back()} />
        <AlertBox>Artisan manquant. Revenez depuis une fiche artisan.</AlertBox>
      </View>
    );
  }

  if (sent) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <ScreenHeader title="Demande envoyée" onBack={() => router.back()} />
        <AlertBox tone="green">Votre demande a été envoyée à {artisanName}.</AlertBox>
        <Button label="Voir mes devis" onPress={() => router.replace('/devis')} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    if (title.trim().length < 3) return setError('Titre trop court (3 caractères min.).');
    if (description.trim().length < 10) {
      return setError('Décrivez votre besoin (10 caractères min.).');
    }
    try {
      await createQuote({
        artisanId,
        title: title.trim(),
        description: description.trim(),
        ...(budget ? { budget: { max: Number(budget) } } : {}),
      }).unwrap();
      setSent(true);
    } catch (createError) {
      setError(errorMessage(createError, "La demande n'a pas pu être envoyée."));
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
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title="Demander un devis"
        subtitle={artisanName}
        onBack={() => router.back()}
      />

      {error ? <AlertBox>{error}</AlertBox> : null}

      <Field label="Titre" hint="Ex. Réparation fuite cuisine">
        <TextField value={title} onChangeText={setTitle} maxLength={120} />
      </Field>
      <Field label="Description">
        <TextField
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={3000}
          placeholder="Décrivez le travail souhaité, le lieu, les délais…"
        />
      </Field>
      <Field label="Budget max (FCFA)" hint="Facultatif">
        <TextField value={budget} onChangeText={setBudget} keyboardType="number-pad" />
      </Field>

      <Button label="Envoyer la demande" loading={isLoading} onPress={submit} />
      <Text style={[typography.small, { marginTop: spacing.md }]}>
        L’artisan recevra une notification et pourra vous répondre dans l’app.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
});
