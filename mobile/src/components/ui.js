import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, TOUCH_TARGET, typography } from '../lib/theme';

/**
 * Bouton tactile style Monpermis : pilule verte (dégradé en primary).
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

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: loading }}
        style={({ pressed }) => [
          styles.pressWrap,
          pressed && !inactive && styles.pressed,
          inactive && styles.inactive,
          style,
        ]}
      >
        <LinearGradient
          colors={gradients.green}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBtn}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryLabel}>{label}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  const palette = VARIANTS[variant] || VARIANTS.secondary;
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
  secondary: { background: colors.background, text: colors.text, border: colors.border },
  ghost: { background: 'transparent', text: 'rgba(255,255,255,0.9)', border: 'transparent' },
  danger: { background: colors.dangerSurface, text: colors.danger, border: 'rgba(232,93,59,0.35)' },
};

/** Points de progression style Monpermis (pilule allongée active). */
export function Dots({ count, active, tone = 'light' }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === active;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              {
                width: isActive ? 22 : 8,
                backgroundColor: isActive
                  ? colors.brand
                  : tone === 'dark'
                    ? colors.border
                    : 'rgba(255, 255, 255, 0.35)',
              },
            ]}
            accessibilityElementsHidden
          />
        );
      })}
    </View>
  );
}

export function ScreenHeader({ title, subtitle, onBack, right }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Retour">
            <Text style={styles.backLabel}>←</Text>
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {children}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  keyboardType,
  autoCapitalize = 'sentences',
  style,
  ...rest
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textLight}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      style={[styles.input, multiline && styles.textarea, style]}
      {...rest}
    />
  );
}

export function SelectField({ label, value, options, onChange, placeholder = 'Choisir…' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Field label={label}>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.select}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={[styles.selectText, !selected && styles.selectPlaceholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Text style={styles.selectChevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label || 'Choisir'}</Text>
            {options.map((option) => (
              <Pressable
                key={String(option.value)}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={[styles.modalOption, option.value === value && styles.modalOptionActive]}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    option.value === value && styles.modalOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </Field>
  );
}

export function Badge({ label, tone = 'green' }) {
  const palette = BADGE_TONES[tone] || BADGE_TONES.green;
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const BADGE_TONES = {
  green: { bg: colors.brandLight, text: colors.brandDark },
  slate: { bg: colors.surface, text: colors.textMuted },
  amber: { bg: '#fef3c7', text: '#b45309' },
};

export function Rating({ value = 0, count }) {
  const stars = Math.round(Number(value) || 0);
  return (
    <Text style={styles.rating}>
      {'★'.repeat(Math.min(stars, 5))}
      {'☆'.repeat(Math.max(0, 5 - stars))}
      {count != null ? ` (${count})` : ''}
    </Text>
  );
}

export function AlertBox({ children, tone = 'danger' }) {
  const palette =
    tone === 'green'
      ? { bg: colors.brandSurface, border: colors.brandLight, text: colors.brandDark }
      : tone === 'amber'
        ? { bg: '#fffbeb', border: '#fde68a', text: '#92400e' }
        : { bg: colors.dangerSurface, border: 'rgba(232,93,59,0.25)', text: colors.danger };

  return (
    <View
      style={[styles.alert, { backgroundColor: palette.bg, borderColor: palette.border }]}
      accessibilityRole="alert"
    >
      <Text style={[styles.alertText, { color: palette.text }]}>{children}</Text>
    </View>
  );
}

export function LoadingView({ label = 'Chargement…' }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.brand} size="large" />
      <Text style={[typography.muted, { marginTop: spacing.sm }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyDesc}>{description}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  pressWrap: {
    borderRadius: radius.full,
    shadowColor: colors.brandDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  gradientBtn: {
    minHeight: TOUCH_TARGET,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryLabel: {
    ...typography.body,
    fontWeight: '700',
    color: '#ffffff',
    fontSize: 16,
  },
  button: {
    minHeight: TOUCH_TARGET,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  inactive: { opacity: 0.5 },
  buttonLabel: { ...typography.body, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', alignItems: 'center' },
  dot: {
    height: 8,
    borderRadius: radius.full,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backLabel: { fontSize: 20, color: colors.text, fontWeight: '600' },
  headerTitle: { ...typography.heading },
  headerSubtitle: { ...typography.small, marginTop: 2 },

  field: { marginBottom: spacing.md },
  label: { ...typography.small, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  hint: { ...typography.small, marginTop: 6 },
  fieldError: { ...typography.small, color: colors.danger, marginTop: 6 },
  input: {
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textarea: { minHeight: 110, textAlignVertical: 'top' },

  select: {
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  selectText: { ...typography.body, flex: 1 },
  selectPlaceholder: { color: colors.textLight },
  selectChevron: { color: colors.textMuted, fontSize: 16, marginLeft: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,31,23,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
    zIndex: 1,
  },
  modalTitle: { ...typography.heading, marginBottom: spacing.md },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionActive: { backgroundColor: colors.brandSurface },
  modalOptionText: { ...typography.body },
  modalOptionTextActive: { color: colors.brandDark, fontWeight: '700' },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  rating: { fontSize: 13, color: colors.accent, fontWeight: '600' },

  alert: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  alertText: { ...typography.muted, lineHeight: 20 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  emptyTitle: { ...typography.heading, textAlign: 'center' },
  emptyDesc: { ...typography.muted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
});
