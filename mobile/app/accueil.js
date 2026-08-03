import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectUser } from '../src/features/auth/authSlice';
import { useListCategoriesQuery } from '../src/features/catalog/catalog.api';
import { colors, radius, spacing, typography } from '../src/lib/theme';

/**
 * Accueil de l'application connectée. Sert pour l'instant de preuve de bout
 * en bout : session restaurée depuis le trousseau, puis appel réel à l'API.
 * La recherche d'artisans viendra le remplacer.
 */
export default function AccueilScreen() {
  const insets = useSafeAreaInsets();
  const user = useSelector(selectUser);
  const { data: categories, isLoading, isError, error } = useListCategoriesQuery();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={typography.title}>L-ARTIS</Text>
      <Text style={[typography.muted, styles.subtitle]}>
        Trouvez un artisan de confiance près de chez vous.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Session</Text>
        <Text style={typography.body}>
          {user ? `Connecté — ${user.firstName} (${user.role})` : 'Aucune session enregistrée'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Connexion à l'API</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.brand} />
        ) : isError ? (
          <Text style={styles.error}>
            Injoignable{error?.status ? ` (${error.status})` : ''}. Vérifiez que le serveur tourne
            et que le téléphone est sur le même réseau.
          </Text>
        ) : (
          <Text style={typography.body}>
            {categories?.length ?? 0} catégorie{(categories?.length ?? 0) > 1 ? 's' : ''} chargée
            {(categories?.length ?? 0) > 1 ? 's' : ''} depuis le serveur
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardLabel: { ...typography.small, marginBottom: spacing.xs, textTransform: 'uppercase' },
  error: { ...typography.muted, color: colors.danger },
});
