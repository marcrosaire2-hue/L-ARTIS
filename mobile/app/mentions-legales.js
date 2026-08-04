import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../src/components/ui';
import { MENTIONS_LEGALES } from '../src/lib/legal/mentionsLegales';
import { colors, radius, spacing, typography } from '../src/lib/theme';

export default function LegalNoticeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <ScreenHeader title={MENTIONS_LEGALES.title} onBack={() => router.back()} />
      <Text style={styles.updated}>Mis à jour le {MENTIONS_LEGALES.updatedAt}</Text>

      {MENTIONS_LEGALES.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={typography.body}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  updated: { ...typography.small, marginTop: spacing.sm, marginBottom: spacing.md },
  section: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.heading, fontSize: 16 },
});
