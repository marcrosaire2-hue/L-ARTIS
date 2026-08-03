import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthShell } from '../src/components/AuthShell';
import { Button } from '../src/components/ui';
import { useForgotPasswordMutation } from '../src/features/auth/auth.api';
import { errorMessage } from '../src/lib/format';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '../src/lib/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
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
    <AuthShell
      kicker="Sécurité"
      title="Mot de passe oublié"
      subtitle="Indiquez votre e-mail ou votre numéro. Vous recevrez un lien (web ou app L-ARTIS)."
    >
      {sent ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            Si un compte correspondant existe avec une adresse e-mail, un message vient d’être
            envoyé.
          </Text>
        </View>
      ) : (
        <>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <View style={styles.field}>
            <Text style={styles.label}>Téléphone ou e-mail</Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="01 47 88 01 43"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
              style={styles.input}
              onSubmitEditing={submit}
            />
          </View>
          <Button label="Envoyer le lien" onPress={submit} loading={isLoading} />
        </>
      )}

      <Pressable onPress={() => router.back()} style={styles.linkWrap}>
        <Text style={styles.link}>Retour à la connexion</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: { ...typography.muted, fontWeight: '600', marginBottom: spacing.xs },
  input: {
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  linkWrap: { alignSelf: 'center', paddingVertical: spacing.lg },
  link: { color: colors.brand, fontWeight: '700' },
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
