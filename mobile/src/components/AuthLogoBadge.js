import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../lib/theme';

/** Logo L-ARTIS centré dans un cercle blanc (pattern Monpermis). */
export function AuthLogoBadge({ size = 72, style }) {
  const logo = Math.round(size * 0.78);
  const inset = Math.round((size - logo) / 2);
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Image
        source={require('../../assets/logo-mark.png')}
        style={{
          position: 'absolute',
          left: inset,
          top: inset,
          width: logo,
          height: logo,
        }}
        resizeMode="contain"
        accessibilityLabel="L-ARTIS"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
});
