import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RealisationForm } from '../src/components/RealisationForm';
import { useCreateMyServiceMutation } from '../src/features/artisans/artisans.api';
import { colors, radius, spacing, typography } from '../src/lib/theme';

/**
 * Étape 2 de la configuration guidée : la première réalisation.
 *
 * C'est l'élément qui fait la différence entre une fiche qu'on regarde et une
 * fiche qu'on contacte — et c'est aussi ce qui rend l'artisan trouvable, car
 * le titre et la description alimentent la recherche.
 */
export default function FirstRealisationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [createService, { isLoading }] = useCreateMyServiceMutation();

  const finish = () => router.replace('/espace-artisan');

  const submit = async (body) => {
    await createService(body).unwrap();
    finish();
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.step}>ÉTAPE 2 SUR 2</Text>
      <Text style={typography.heading}>Votre première réalisation</Text>
      <Text style={[typography.muted, { marginTop: spacing.xs }]}>
        Montrez un travail que vous avez terminé. Une photo vaut toutes les descriptions.
      </Text>

      <View style={styles.examples}>
        <Text style={styles.examplesTitle}>Selon votre métier</Text>
        <Text style={typography.small}>Coiffure : « Braids Butterfly » · 15 000 F · 3 h</Text>
        <Text style={typography.small}>Couture : « Robe de soirée sur mesure » · sur devis</Text>
        <Text style={typography.small}>Menuiserie : « Table en bois massif » · 120 000 F</Text>
        <Text style={typography.small}>Photo : « Shooting mariage » · forfait journée</Text>
      </View>

      <View style={styles.card}>
        <RealisationForm
          submitting={isLoading}
          submitLabel="Publier et terminer"
          onSubmit={submit}
          onSkip={finish}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  step: { ...typography.small, fontWeight: '800', color: colors.brand, letterSpacing: 1 },
  examples: {
    backgroundColor: colors.brandSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
  examplesTitle: { ...typography.small, fontWeight: '700', color: colors.brandDark, marginBottom: 4 },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});
