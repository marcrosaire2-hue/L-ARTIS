import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AlertBox, Button, ScreenHeader } from '../src/components/ui';
import { useAcceptTermsMutation } from '../src/features/auth/auth.api';
import { selectUser, userUpdated } from '../src/features/auth/authSlice';
import { REGLEMENT_ARTISAN } from '../src/lib/legal/reglementArtisan';
import { REGLEMENT_CLIENT } from '../src/lib/legal/reglementClient';
import { errorMessage } from '../src/lib/format';
import { colors, radius, spacing, typography } from '../src/lib/theme';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const params = useLocalSearchParams();

  const acceptMode = params.accept === '1';
  const audience =
    params.audience === 'artisan' || user?.role === 'artisan' ? 'artisan' : 'client';
  const content = audience === 'artisan' ? REGLEMENT_ARTISAN : REGLEMENT_CLIENT;

  const [acceptTerms, { isLoading, error }] = useAcceptTermsMutation();

  const onAccept = async () => {
    try {
      const result = await acceptTerms().unwrap();
      dispatch(userUpdated(result.user ?? result));
      if (user?.email && !user.isEmailVerified) {
        router.replace({
          pathname: '/verification-email',
          params: { email: user.email },
        });
      } else {
        router.replace(user?.role === 'artisan' ? '/espace-artisan' : '/accueil');
      }
    } catch {
      /* error shown below */
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <ScreenHeader
        title={content.title}
        subtitle={`Version ${content.version}`}
        onBack={acceptMode ? undefined : () => router.back()}
      />

      {content.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={typography.body}>{section.body}</Text>
        </View>
      ))}

      {acceptMode ? (
        <View style={styles.acceptBlock}>
          <AlertBox tone="amber">
            Vous devez accepter ce règlement pour utiliser L-ARTIS.
          </AlertBox>
          {error ? <AlertBox>{errorMessage(error, "L'acceptation a échoué.")}</AlertBox> : null}
          <Button label="J'accepte" loading={isLoading} onPress={onAccept} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
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
  acceptBlock: { gap: spacing.md, marginTop: spacing.sm },
});
