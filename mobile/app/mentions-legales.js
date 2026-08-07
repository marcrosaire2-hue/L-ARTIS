import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui';
import { mentionsLegales } from '../src/lib/legal/mentionsLegales';
import { colors, radius, spacing, typography } from '../src/lib/theme';

export default function MentionsLegalesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl },
      ]}
    >
      <Text style={typography.heading}>{mentionsLegales.title}</Text>
      <Text style={[typography.muted, { marginTop: spacing.sm }]}>{mentionsLegales.intro}</Text>

      {mentionsLegales.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.paragraphs.map((paragraph, index) => (
            <Text key={`${section.title}-${index}`} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}

      <Button
        label="Règlement clients"
        variant="secondary"
        onPress={() => router.push({ pathname: '/reglement', params: { audience: 'client' } })}
        style={{ marginTop: spacing.lg }}
      />
      <Button
        label="Règlement artisans"
        variant="secondary"
        onPress={() => router.push({ pathname: '/reglement', params: { audience: 'artisan' } })}
        style={{ marginTop: spacing.sm }}
      />
      <Button label="Retour" variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.body, fontWeight: '700', color: colors.text },
  paragraph: { ...typography.small, lineHeight: 20, color: colors.textMuted },
});
