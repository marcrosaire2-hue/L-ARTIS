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
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui';
import { useLoginMutation } from '../src/features/auth/auth.api';
import { credentialsReceived } from '../src/features/auth/authSlice';
import { errorMessage } from '../src/lib/format';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '../src/lib/theme';

/**
 * Connexion — écran d'arrivée après l'introduction.
 *
 * L'identifiant est le numéro de téléphone (l'e-mail reste accepté pour les
 * comptes qui en ont renseigné un). Le clavier s'ouvre en mode numérique :
 * sur un téléphone, imposer le clavier alphabétique pour saisir un numéro
 * est une friction gratuite.
 */
export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [login, { isLoading }] = useLoginMutation();

  const [identifier, setIdentifier] = useState('');
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
      router.replace('/accueil');
    } catch (loginError) {
      setError(errorMessage(loginError, 'Connexion impossible.'));
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

        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Entrez votre numéro pour accéder à votre compte.</Text>

        {error && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

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
              accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              <Text style={styles.revealText}>{visible ? 'Masquer' : 'Afficher'}</Text>
            </Pressable>
          </View>
        </View>

        <Button label="Se connecter" onPress={submit} loading={isLoading} style={styles.action} />

        <Pressable onPress={() => router.push('/mot-de-passe-oublie')} style={styles.link}>
          <Text style={styles.linkText}>Mot de passe oublié ?</Text>
        </Pressable>

        <View style={styles.separator} />

        <Text style={styles.footerText}>Vous n'avez pas encore de compte ?</Text>
        <Button
          label="Créer un compte"
          variant="secondary"
          onPress={() => router.push('/inscription')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg },
  logo: { width: 96, height: 96, alignSelf: 'center', marginBottom: spacing.lg },
  title: { ...typography.title, textAlign: 'center' },
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
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 90 },
  reveal: { position: 'absolute', right: spacing.md, paddingVertical: spacing.xs },
  revealText: { ...typography.muted, color: colors.brand, fontWeight: '600' },
  action: { marginTop: spacing.sm },
  link: { alignSelf: 'center', paddingVertical: spacing.md },
  linkText: { ...typography.muted, color: colors.brand, fontWeight: '600' },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  footerText: { ...typography.muted, textAlign: 'center', marginBottom: spacing.sm },
  errorBox: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.muted, color: colors.danger },
});
