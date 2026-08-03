import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui';
import { useForgotPasswordMutation } from '../src/features/auth/auth.api';
import { errorMessage } from '../src/lib/format';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '../src/lib/theme';

/**
 * Mot de passe oublié — envoie un lien de réinitialisation si un e-mail est
 * associé au compte. L'API répond toujours OK (anti-énumération) : le message
 * affiché ici reste volontairement neutre.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setError(null);
    if (!identifier.trim()) {
      return setError('Indiquez votre numéro de téléphone ou votre e-mail.');
    }
    try {
      await forgotPassword(identifier.trim()).unwrap();
      setSent(true);
    } catch (forgotError) {
      setError(errorMessage(forgotError, "Impossible d'envoyer la demande."));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="L-ARTIS"
        />

        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          Entrez le numéro ou l’e-mail du compte. Si un e-mail y est associé, vous
          recevrez un lien de réinitialisation.
        </Text>

        {sent ? (
          <View style={styles.successBox} accessibilityRole="alert">
            <Text style={styles.successText}>
              Si un compte correspondant existe avec une adresse e-mail, un message
              vient d’être envoyé. Vérifiez votre boîte de réception.
            </Text>
          </View>
        ) : (
          <>
            {error && (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Téléphone ou e-mail</Text>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="01 47 88 01 43"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
                autoComplete="username"
                style={styles.input}
                onSubmitEditing={submit}
                returnKeyType="send"
              />
            </View>

            <Button label="Envoyer le lien" onPress={submit} loading={isLoading} />
          </>
        )}

        <Pressable onPress={() => router.back()} style={styles.link}>
          <Text style={styles.linkText}>Retour à la connexion</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg },
  logo: { width: 96, height: 96, alignSelf: 'center', marginBottom: spacing.lg },
  title: { ...typography.title, textAlign: 'center', fontSize: 24 },
  subtitle: {
    ...typography.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  field: { marginBottom: spacing.md },
  label: { ...typography.muted, fontWeight: '600', marginBottom: spacing.xs },
  input: {
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  link: { alignSelf: 'center', paddingVertical: spacing.lg },
  linkText: { ...typography.muted, color: colors.brand, fontWeight: '600' },
  errorBox: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.muted, color: colors.danger },
  successBox: {
    backgroundColor: colors.brandSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successText: { ...typography.muted, color: colors.brandDark },
});
