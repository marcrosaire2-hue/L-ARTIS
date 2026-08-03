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
import { useLoginMutation, useRegisterMutation } from '../src/features/auth/auth.api';
import { credentialsReceived } from '../src/features/auth/authSlice';
import { BENIN_PHONE_HINT, errorMessage, isBeninPhone } from '../src/lib/format';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '../src/lib/theme';

const ROLES = {
  CLIENT: 'client',
  ARTISAN: 'artisan',
};

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Inscription — choix Client / Artisan, puis formulaire minimal aligné sur
 * l'API. Après succès on enchaîne immédiatement sur la connexion pour ouvrir
 * la session (register ne renvoie pas de jetons).
 */
export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const [role, setRole] = useState(ROLES.CLIENT);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(null);

  const isLoading = isRegistering || isLoggingIn;

  const validate = () => {
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return 'Indiquez votre prénom et votre nom (2 caractères minimum).';
    }
    if (!isBeninPhone(phone)) {
      return BENIN_PHONE_HINT;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Adresse e-mail invalide.';
    }
    if (role === ROLES.ARTISAN && businessName.trim().length < 2) {
      return 'Le nom commercial est obligatoire pour un artisan.';
    }
    if (!PASSWORD_RULE.test(password)) {
      return 'Mot de passe : 8 caractères min., une majuscule, une minuscule et un chiffre.';
    }
    if (password !== confirm) {
      return 'Les mots de passe ne correspondent pas.';
    }
    return null;
  };

  const submit = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) return setError(validationError);

    const body = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      password,
      role,
    };
    if (email.trim()) body.email = email.trim().toLowerCase();
    if (role === ROLES.ARTISAN) {
      body.artisanData = { businessName: businessName.trim() };
    }

    try {
      await register(body).unwrap();
      const session = await login({ identifier: phone.trim(), password }).unwrap();
      dispatch(credentialsReceived(session));
      router.replace('/accueil');
    } catch (registerError) {
      setError(errorMessage(registerError, "Impossible de créer le compte."));
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
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="L-ARTIS"
        />

        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>
          Choisissez votre profil, puis renseignez vos informations.
        </Text>

        <View style={styles.roleRow} accessibilityRole="tablist">
          <RoleChip
            label="Client"
            active={role === ROLES.CLIENT}
            onPress={() => setRole(ROLES.CLIENT)}
          />
          <RoleChip
            label="Artisan"
            active={role === ROLES.ARTISAN}
            onPress={() => setRole(ROLES.ARTISAN)}
          />
        </View>

        {error && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Field label="Prénom">
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            autoComplete="given-name"
            placeholder="Kofi"
            placeholderTextColor={colors.textLight}
            style={styles.input}
          />
        </Field>

        <Field label="Nom">
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            autoComplete="family-name"
            placeholder="Mensah"
            placeholderTextColor={colors.textLight}
            style={styles.input}
          />
        </Field>

        <Field label="Numéro de téléphone">
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="01 47 88 01 43"
            placeholderTextColor={colors.textLight}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoComplete="tel"
            style={styles.input}
          />
        </Field>

        <Field label="E-mail (optionnel)">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="vous@exemple.bj"
            placeholderTextColor={colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
          />
        </Field>

        {role === ROLES.ARTISAN && (
          <Field label="Nom commercial">
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Atelier Mensah"
              placeholderTextColor={colors.textLight}
              style={styles.input}
            />
          </Field>
        )}

        <Field label="Mot de passe">
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!visible}
              autoCapitalize="none"
              autoComplete="new-password"
              style={[styles.input, styles.passwordInput]}
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
        </Field>

        <Field label="Confirmer le mot de passe">
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoComplete="new-password"
            style={styles.input}
            onSubmitEditing={submit}
            returnKeyType="go"
          />
        </Field>

        <Button
          label="Créer mon compte"
          onPress={submit}
          loading={isLoading}
          style={styles.action}
        />

        <Pressable onPress={() => router.back()} style={styles.link}>
          <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoleChip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg },
  logo: { width: 80, height: 80, alignSelf: 'center', marginBottom: spacing.md },
  title: { ...typography.title, textAlign: 'center', fontSize: 24 },
  subtitle: {
    ...typography.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  chipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSurface,
  },
  chipText: { ...typography.body, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.brandDark },
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
  link: { alignSelf: 'center', paddingVertical: spacing.lg },
  linkText: { ...typography.muted, color: colors.brand, fontWeight: '600' },
  errorBox: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.muted, color: colors.danger },
});
