import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { AuthShell } from '../src/components/AuthShell';
import { Button } from '../src/components/ui';
import { useLoginMutation } from '../src/features/auth/auth.api';
import { credentialsReceived } from '../src/features/auth/authSlice';
import { errorMessage } from '../src/lib/format';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '../src/lib/theme';

/** Connexion — coquille hero + feuille (procédure Monpermis). */
export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams();
  const [login, { isLoading }] = useLoginMutation();

  // Pré-rempli quand on arrive d'une inscription dont la connexion
  // automatique a échoué : l'utilisateur n'a pas à retaper son numéro.
  const [identifier, setIdentifier] = useState(
    typeof params.identifier === 'string' ? params.identifier : ''
  );
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    if (!identifier.trim() || !password) {
      return setError('Renseignez votre numéro et votre mot de passe.');
    }
    try {
      const session = await login({ identifier: identifier.trim(), password }).unwrap();
      dispatch(credentialsReceived(session));

      // Inscription interrompue avant la validation du règlement : on reprend
      // le parcours là où il s'est arrêté plutôt que d'ouvrir une app dont
      // toutes les sections sont verrouillées.
      const account = session.user;
      if (account && account.role !== 'admin' && !account.termsAcceptedAt) {
        router.replace({
          pathname: '/reglement',
          params: {
            audience: account.role === 'artisan' ? 'artisan' : 'client',
            accept: '1',
            email: account.email || '',
          },
        });
        return;
      }
      // L'écran d'attente bascule seul vers l'espace artisan une fois le
      // profil validé : il ne retient pas un artisan déjà publié.
      router.replace(account?.role === 'artisan' ? '/attente-validation' : '/accueil');
    } catch (loginError) {
      setError(errorMessage(loginError, 'Connexion impossible.'));
    }
  };

  return (
    <AuthShell
      heroSource={require('../assets/client.jpg')}
      kicker="Connexion"
      title="Content de vous revoir"
      subtitle="Connectez-vous avec votre numéro pour accéder à L-ARTIS."
    >
      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="01 47 88 01 43"
          placeholderTextColor={colors.textLight}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoComplete="tel"
          style={styles.input}
        />
        <Text style={styles.hint}>Ou votre e-mail si vous en avez renseigné un.</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoComplete="current-password"
            style={[styles.input, styles.passwordInput]}
            onSubmitEditing={submit}
            returnKeyType="go"
          />
          <Pressable
            onPress={() => setVisible((v) => !v)}
            style={styles.reveal}
            accessibilityRole="button"
          >
            <Text style={styles.revealText}>{visible ? 'Masquer' : 'Afficher'}</Text>
          </Pressable>
        </View>
      </View>

      <Pressable onPress={() => router.push('/mot-de-passe-oublie')} style={styles.forgot}>
        <Text style={styles.link}>Mot de passe oublié ?</Text>
      </Pressable>

      <Button label="Se connecter" onPress={submit} loading={isLoading} />

      <Text style={styles.footer}>
        Pas encore de compte ?{' '}
        <Text style={styles.link} onPress={() => router.push('/inscription')}>
          Créer un compte
        </Text>
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: {
    ...typography.muted,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  hint: { ...typography.small, marginTop: spacing.xs },
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
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 90 },
  reveal: { position: 'absolute', right: spacing.md, paddingVertical: spacing.xs },
  revealText: { ...typography.muted, color: colors.brand, fontWeight: '700' },
  forgot: { alignSelf: 'flex-end', marginBottom: spacing.md },
  link: { color: colors.brand, fontWeight: '700' },
  footer: {
    ...typography.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  errorBox: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.muted, color: colors.danger },
});
