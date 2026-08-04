import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AuthShell } from '../src/components/AuthShell';
import { Button } from '../src/components/ui';
import {
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from '../src/features/auth/auth.api';
import { selectUser, userUpdated } from '../src/features/auth/authSlice';
import { errorMessage } from '../src/lib/format';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '../src/lib/theme';

/**
 * Saisie du code à 6 chiffres reçu par e-mail.
 * Route : /verification-email?email=…
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams();
  const sessionUser = useSelector(selectUser);

  const emailParam = typeof params.email === 'string' ? params.email : params.email?.[0];
  const email = (emailParam || sessionUser?.email || '').trim().toLowerCase();

  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [resend, { isLoading: resending }] = useResendVerificationMutation();

  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    setInfo(null);
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) return setError('Saisissez les 6 chiffres du code.');
    if (!email) return setError('Adresse e-mail manquante. Revenez à l’inscription.');

    try {
      const result = await verifyEmail({ code: digits, email }).unwrap();
      if (result?.user) dispatch(userUpdated(result.user));
      const pending =
        result?.pendingArtisanValidation === true ||
        (result?.user?.role || sessionUser?.role) === 'artisan';
      setDone(pending ? 'pending' : 'ok');
    } catch (verifyError) {
      setError(errorMessage(verifyError, 'Code invalide ou expiré.'));
    }
  };

  const onResend = async () => {
    setError(null);
    setInfo(null);
    if (!email) return setError('Adresse e-mail manquante.');
    try {
      await resend(email).unwrap();
      setInfo('Un nouveau code a été envoyé. Vérifiez votre boîte mail.');
    } catch (resendError) {
      setError(errorMessage(resendError, "Impossible d'envoyer un nouveau code."));
    }
  };

  if (done === 'pending') {
    return (
      <AuthShell
        heroSource={require('../assets/artisan.jpg')}
        kicker="Inscription"
        title="Merci de patienter"
        subtitle="Votre e-mail est confirmé. Notre équipe va valider votre profil artisan. Vous recevrez ensuite un e-mail de bienvenue."
      >
        <Button
          label="Voir l'état de validation"
          onPress={() => router.replace('/attente-validation')}
        />
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell
        kicker="Compte"
        title="Adresse confirmée"
        subtitle="Votre e-mail est vérifié. Vous pouvez utiliser la récupération de mot de passe en toute sécurité."
      >
        <Button label="Continuer" onPress={() => router.replace('/accueil')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Vérification"
      title="Code reçu par e-mail"
      subtitle={
        email
          ? `Entrez le code à 6 chiffres envoyé à ${email}. Il expire dans 15 minutes.`
          : 'Entrez le code à 6 chiffres reçu par e-mail.'
      }
    >
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {info ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{info}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Code de vérification</Text>
        <TextInput
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={colors.textLight}
          style={styles.codeInput}
          onSubmitEditing={submit}
        />
      </View>

      <Button label="Vérifier" loading={isLoading} onPress={submit} />

      <Pressable onPress={onResend} disabled={resending} style={styles.linkWrap}>
        <Text style={styles.link}>{resending ? 'Envoi…' : 'Renvoyer le code'}</Text>
      </Pressable>

      <Pressable
        onPress={() =>
          router.replace(
            sessionUser?.role === 'artisan' ? '/attente-validation' : '/accueil'
          )
        }
        style={styles.linkWrap}
      >
        <Text style={styles.skip}>Plus tard</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: { ...typography.muted, fontWeight: '600', marginBottom: spacing.xs },
  codeInput: {
    minHeight: TOUCH_TARGET + 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 10,
    textAlign: 'center',
    color: colors.text,
    backgroundColor: colors.surface,
  },
  linkWrap: { alignSelf: 'center', paddingVertical: spacing.md },
  link: { color: colors.brand, fontWeight: '700' },
  skip: { color: colors.textMuted, fontWeight: '600' },
  errorBox: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.muted, color: colors.danger },
  infoBox: {
    backgroundColor: colors.brandSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoText: { ...typography.muted, color: colors.brandDark },
});
