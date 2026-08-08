import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertBox, Button } from '../src/components/ui';
import { useAcceptTermsMutation } from '../src/features/auth/auth.api';
import { selectUser, userUpdated } from '../src/features/auth/authSlice';
import { errorMessage } from '../src/lib/format';
import { reglementArtisan } from '../src/lib/legal/reglementArtisan';
import { reglementClient } from '../src/lib/legal/reglementClient';
import { colors, radius, spacing, typography } from '../src/lib/theme';

const DOCUMENTS = {
  client: reglementClient,
  artisan: reglementArtisan,
};

/**
 * Lecture du règlement (public) ou protocole post-inscription (accept=1).
 */
export default function ReglementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams();
  const user = useSelector(selectUser);

  const audience = params.audience === 'artisan' ? 'artisan' : 'client';
  const document = DOCUMENTS[audience];
  const acceptMode = params.accept === '1' && !user?.termsAcceptedAt;
  const email = params.email || user?.email || '';

  const [checked, setChecked] = useState(false);
  const [error, setError] = useState(null);
  const [acceptTerms, { isLoading }] = useAcceptTermsMutation();

  // Destination finale du parcours : l'artisan doit arriver dans son espace,
  // c'est là que se complète la fiche dont dépend sa publication.
  const homeRoute = useMemo(() => {
    if (params.next) return String(params.next);
    if (user?.role !== 'artisan') return '/(tabs)/compte';
    // Au premier passage, l'artisan enchaîne sur la configuration guidée ;
    // ensuite, il retrouve directement son espace.
    return params.onboarding === '1' ? '/bienvenue-artisan' : '/espace-artisan';
  }, [params.next, params.onboarding, user]);
  // Détour par la saisie du code seulement si l'inscription a confirmé
  // l'envoi (params.verify). Sans envoi possible, l'étape est sautée.
  const needsEmailCheck =
    params.verify === '1' && Boolean(email) && !user?.isEmailVerified;

  useEffect(() => {
    if (user && !user.termsAcceptedAt && !acceptMode && params.force !== '0') {
      // Compte existant sans acceptation : bascule en mode protocole.
      router.replace({
        pathname: '/reglement',
        params: {
          audience: user.role === 'artisan' ? 'artisan' : 'client',
          accept: '1',
          email: user.email || '',
        },
      });
    }
  }, [user, acceptMode, params.force, router]);

  const onValidate = async () => {
    setError(null);
    if (!checked) {
      setError('Cochez la case pour confirmer que vous avez lu et accepté le règlement.');
      return;
    }
    if (!user) {
      setError('Votre session a expiré. Connectez-vous pour valider le règlement.');
      return;
    }

    try {
      const result = await acceptTerms().unwrap();
      if (result?.user) dispatch(userUpdated(result.user));

      if (needsEmailCheck) {
        router.replace({
          pathname: '/verification-email',
          params: { email: String(email), next: homeRoute },
        });
        return;
      }
      router.replace(homeRoute);
    } catch (acceptError) {
      setError(errorMessage(acceptError, "La validation n'a pas abouti."));
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: acceptMode ? 220 : insets.bottom + spacing.xxl },
        ]}
      >
        {acceptMode ? (
          <AlertBox tone="amber">
            Lisez le règlement ci-dessous puis validez. Étape obligatoire après inscription (Code du
            numérique — Bénin).
          </AlertBox>
        ) : null}

        <Text style={typography.heading}>{document.title}</Text>
        <Text style={styles.subtitle}>{document.subtitle}</Text>
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>{document.intro}</Text>

        {document.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph, index) => (
              <Text key={`${section.title}-${index}`} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        {!acceptMode ? (
          <>
            <Button
              label="Mentions légales"
              variant="secondary"
              onPress={() => router.push('/mentions-legales')}
              style={{ marginTop: spacing.lg }}
            />
            <Button label="Retour" variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.sm }} />
          </>
        ) : null}
      </ScrollView>

      {acceptMode ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          {error ? <AlertBox>{error}</AlertBox> : null}
          <Pressable
            onPress={() => setChecked((value) => !value)}
            style={styles.checkRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
          >
            <View style={[styles.checkbox, checked && styles.checkboxOn]}>
              {checked ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.checkLabel}>{document.acceptanceLabel}</Text>
          </Pressable>
          {user ? (
            <Button
              label="Valider et continuer"
              loading={isLoading}
              disabled={!checked}
              onPress={onValidate}
            />
          ) : (
            // Sans session, l'API refuse l'acceptation : la seule issue est de
            // se connecter, l'écran doit donc y mener au lieu de tourner en rond.
            <Button label="Se connecter pour valider" onPress={() => router.replace('/connexion')} />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg },
  subtitle: { ...typography.small, color: colors.brand, fontWeight: '700', marginTop: 4 },
  section: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.body, fontWeight: '700' },
  paragraph: { ...typography.small, lineHeight: 20, color: colors.textMuted },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkMark: { color: '#fff', fontWeight: '700', fontSize: 12 },
  checkLabel: { flex: 1, ...typography.small, lineHeight: 18, color: colors.text },
});
