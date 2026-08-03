import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthShell } from '../src/components/AuthShell';
import { Button } from '../src/components/ui';
import { useResetPasswordMutation } from '../src/features/auth/auth.api';
import { errorMessage } from '../src/lib/format';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '../src/lib/theme';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Deep link : lartis://reinitialiser-mot-de-passe?token=…
 * Également joignable depuis le lien web du même chemin.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = typeof params.token === 'string' ? params.token : params.token?.[0];

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    if (!PASSWORD_RULE.test(password)) {
      return setError('8 caractères min., une majuscule, une minuscule et un chiffre.');
    }
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.');
    try {
      await resetPassword({ token, newPassword: password }).unwrap();
      setDone(true);
    } catch (resetError) {
      setError(errorMessage(resetError, 'Réinitialisation impossible.'));
    }
  };

  if (!token) {
    return (
      <AuthShell
        kicker="Sécurité"
        title="Lien incomplet"
        subtitle="Ce lien ne contient pas de jeton. Ouvrez-le depuis l'e-mail reçu."
      >
        <Button
          label="Demander un nouveau lien"
          variant="secondary"
          onPress={() => router.replace('/mot-de-passe-oublie')}
        />
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell
        kicker="Sécurité"
        title="Mot de passe mis à jour"
        subtitle="Toutes vos sessions ouvertes ont été fermées. Connectez-vous avec le nouveau mot de passe."
      >
        <Button label="Se connecter" onPress={() => router.replace('/connexion')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Sécurité"
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe solide. Vos autres sessions seront fermées."
    >
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Nouveau mot de passe</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          style={styles.input}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Confirmation</Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          style={styles.input}
          onSubmitEditing={submit}
        />
      </View>

      <Button label="Enregistrer" loading={isLoading} onPress={submit} />
      <Pressable onPress={() => router.replace('/connexion')} style={styles.linkWrap}>
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
});
