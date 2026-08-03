import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '../lib/theme';

/**
 * Bouton tactile. `Pressable` plutôt que `TouchableOpacity` : il expose
 * l'état pressé, ce qui permet un retour visuel immédiat — indispensable
 * quand le réseau est lent et que l'utilisateur doute d'avoir appuyé.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) {
  const inactive = disabled || loading;
  const palette = VARIANTS[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.background, borderColor: palette.border },
        pressed && !inactive && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={[styles.buttonLabel, { color: palette.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const VARIANTS = {
  primary: { background: colors.brand, text: '#ffffff', border: colors.brand },
  secondary: { background: colors.background, text: colors.text, border: colors.border },
  ghost: { background: 'transparent', text: colors.textMuted, border: 'transparent' },
};

/** Points de progression d'un carrousel d'introduction. */
export function Dots({ count, active, tone = 'light' }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            { backgroundColor: tone === 'dark' ? colors.border : 'rgba(255, 255, 255, 0.45)' },
            index === active && styles.dotActive,
            index === active && tone === 'light' && styles.dotActiveLight,
          ]}
          accessibilityElementsHidden
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: TOUCH_TARGET,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  inactive: { opacity: 0.5 },
  buttonLabel: { ...typography.body, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: { width: 24, backgroundColor: colors.brand },
  dotActiveLight: { width: 24, backgroundColor: '#ffffff' },
});
