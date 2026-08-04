import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getCatalogGlyph } from '../lib/catalogIcons';
import { mediaUrl } from '../lib/format';
import { colors } from '../lib/theme';

const SIZES = {
  sm: 40,
  md: 52,
  lg: 64,
};

/**
 * Visuel catégorie / métier : image uploadée en priorité, sinon glyphe.
 * Repli automatique si l'image échoue.
 */
export function CatalogVisual({
  image,
  icon,
  size = 'md',
  tone = 'brand',
  style,
}) {
  const [failed, setFailed] = useState(false);
  const box = typeof size === 'number' ? size : SIZES[size] ?? SIZES.md;
  const uri = mediaUrl(image);
  const radiusSize = Math.max(10, Math.round(box * 0.22));

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        onError={() => setFailed(true)}
        style={[
          styles.image,
          {
            width: box,
            height: box,
            borderRadius: radiusSize,
          },
          style,
        ]}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View
      style={[
        styles.box,
        {
          width: box,
          height: box,
          borderRadius: radiusSize,
          backgroundColor: tone === 'slate' ? colors.surface : colors.brandSurface,
        },
        style,
      ]}
      accessibilityElementsHidden
    >
      <Text style={{ fontSize: Math.round(box * 0.42) }}>{getCatalogGlyph(icon)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
