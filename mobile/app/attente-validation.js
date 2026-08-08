import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { AuthShell } from '../src/components/AuthShell';
import { Button } from '../src/components/ui';
import { useGetMyArtisanQuery } from '../src/features/artisans/artisans.api';
import { selectUser } from '../src/features/auth/authSlice';
import { colors, radius, spacing, typography } from '../src/lib/theme';

/**
 * Après vérification e-mail, l'artisan attend la validation admin.
 * Quand le statut passe à « validated », redirection vers l'espace artisan.
 */
export default function PendingValidationScreen() {
  const router = useRouter();
  const user = useSelector(selectUser);

  const { data, isFetching } = useGetMyArtisanQuery(undefined, {
    skip: user?.role !== 'artisan',
    pollingInterval: 20000,
    refetchOnFocus: true,
  });

  const artisan = data?.artisan;
  const status = artisan?.status;

  useEffect(() => {
    if (user && user.role !== 'artisan') {
      router.replace('/accueil');
    }
  }, [user, router]);

  useEffect(() => {
    if (status === 'validated') {
      router.replace('/espace-artisan');
    }
  }, [status, router]);

  if (status === 'rejected') {
    return (
      <AuthShell
        heroSource={require('../assets/artisan.jpg')}
        kicker="Profil"
        title="Profil refusé"
        subtitle={
          artisan?.rejectionReason
            ? artisan.rejectionReason
            : 'Votre profil a été refusé. Corrigez vos informations puis contactez le support.'
        }
      >
        <Button label="Compléter mon profil" onPress={() => router.replace('/espace-artisan')} />
        <Button
          label="Retour à l'accueil"
          variant="secondary"
          onPress={() => router.replace('/accueil')}
          style={{ marginTop: spacing.sm }}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heroSource={require('../assets/artisan.jpg')}
      kicker="Inscription"
      title="En attente de validation"
      subtitle="Merci de patienter. Notre équipe examine votre profil artisan avant publication."
    >
      <View style={styles.box}>
        <Text style={styles.boxTitle}>Que se passe-t-il maintenant ?</Text>
        <Text style={styles.boxText}>
          Votre e-mail est confirmé. Dès que votre compte sera validé, vous recevrez un e-mail de
          bienvenue et pourrez recevoir des demandes de devis.
        </Text>
        <Text style={styles.boxHint}>
          {isFetching ? 'Vérification du statut…' : 'Délai habituel : 24 à 48 h.'}
        </Text>
      </View>

      <Button label="Compléter mon profil" onPress={() => router.push('/espace-artisan')} />
      <Button
        label="Retour à l'accueil"
        variant="secondary"
        onPress={() => router.replace('/accueil')}
        style={{ marginTop: spacing.sm }}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.brandSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  boxTitle: { ...typography.heading, fontSize: 16, color: colors.brandDark },
  boxText: { ...typography.muted, color: colors.text, lineHeight: 22 },
  boxHint: { ...typography.small, color: colors.textMuted },
});
