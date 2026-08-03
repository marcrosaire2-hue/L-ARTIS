import { useEffect, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthLogoBadge } from './AuthLogoBadge';
import { colors, gradients, radius, spacing, typography } from '../lib/theme';

/**
 * Coquille auth Monpermis : hero photo + voile navy + badge logo,
 * puis feuille claire qui remonte par-dessus.
 */
export function AuthShell({
  heroSource = require('../../assets/client.jpg'),
  brand = 'L-ARTIS',
  tagline = 'Trouvez un artisan de confiance, près de chez vous.',
  kicker,
  title,
  subtitle,
  children,
}) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <View style={styles.root}>
      <ImageBackground source={heroSource} style={styles.hero} imageStyle={styles.heroImage}>
        <LinearGradient colors={gradients.authVeil} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
        <View style={[styles.heroSafe, { paddingTop: insets.top + spacing.md }]}>
          <Animated.View style={[styles.heroCopy, { opacity, transform: [{ translateY }] }]}>
            <AuthLogoBadge size={72} style={styles.logoBadge} />
            <Text style={styles.brand}>{brand}</Text>
            <Text style={styles.tagline}>{tagline}</Text>
          </Animated.View>
        </View>
      </ImageBackground>

      <View style={styles.panel}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  hero: { minHeight: 230, justifyContent: 'flex-end' },
  heroImage: { resizeMode: 'cover' },
  heroSafe: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  heroCopy: { alignItems: 'center' },
  logoBadge: { marginBottom: 14 },
  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    ...typography.muted,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    maxWidth: 300,
    fontSize: 15,
    lineHeight: 22,
  },
  panel: {
    flex: 1,
    marginTop: -18,
    backgroundColor: colors.panel,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  kicker: { ...typography.kicker, marginBottom: 6 },
  title: {
    ...typography.title,
    fontSize: 26,
    marginBottom: 6,
  },
  subtitle: {
    ...typography.muted,
    marginBottom: spacing.lg,
    maxWidth: 320,
  },
});
