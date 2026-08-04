import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  getCatalogIconName,
  isEmojiIcon,
  MaterialCommunityIcons,
} from '../lib/catalogIcons';
import { mediaUrl } from '../lib/format';
import { colors } from '../lib/theme';

const SIZES = {
  sm: 40,
  md: 52,
  lg: 64,
};

/**
 * Visuel catégorie / métier : image uploadée en priorité, sinon icône
 * (clé Lucide admin ou emoji legacy). Repli automatique si l'image échoue.
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

  const boxStyle = [
    styles.box,
    {
      width: box,
      height: box,
      borderRadius: radiusSize,
      backgroundColor: tone === 'slate' ? colors.surface : colors.brandSurface,
    },
    style,
  ];

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

  if (isEmojiIcon(icon)) {
    return (
      <View style={boxStyle} accessibilityElementsHidden>
        <Text style={{ fontSize: Math.round(box * 0.42) }}>{icon.trim()}</Text>
      </View>
    );
  }

  return (
    <View style={boxStyle} accessibilityElementsHidden>
      <MaterialCommunityIcons
        name={getCatalogIconName(icon)}
        size={Math.round(box * 0.48)}
        color={tone === 'slate' ? colors.textMuted : colors.brandDark}
      />
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
