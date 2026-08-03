import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Dots } from '../src/components/ui';
import { markIntroSeen } from '../src/lib/onboarding';
import { colors, gradients, radius, spacing, typography } from '../src/lib/theme';

/**
 * Onboarding photo plein écran — même procédure que Monpermis :
 * voile navy, kicker vert, titre blanc, points + CTA pilule, Passer.
 */
const SLIDES = [
  {
    key: 'client',
    image: require('../assets/client.jpg'),
    kicker: 'L-ARTIS — Bénin',
    title: 'Trouvez le bon artisan, près de chez vous',
    body: 'Recherchez par métier et par commune, comparez les tarifs en FCFA et contactez directement.',
  },
  {
    key: 'artisan',
    image: require('../assets/artisan.jpg'),
    kicker: 'Espace artisan',
    title: 'Faites-vous connaître et recevez des demandes',
    body: 'Créez votre fiche gratuitement, ajoutez vos prestations et touchez les clients de votre commune.',
  },
];

function Slide({ item, width, bottomInset, topInset }) {
  return (
    <View style={[styles.slide, { width }]}>
      <ImageBackground source={item.image} style={styles.background} resizeMode="cover">
        <LinearGradient colors={gradients.heroVeil} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <View style={[styles.topBar, { paddingTop: topInset + spacing.sm }]}>
          <Text style={styles.brandTop}>L-ARTIS</Text>
        </View>
        <View style={[styles.content, { paddingBottom: bottomInset }]}>
          <Text style={styles.kicker}>{item.kicker}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

export default function IntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    await markIntroSeen();
    router.replace('/connexion');
  };

  const next = async () => {
    if (!isLast) {
      setIndex(index + 1);
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      return;
    }
    await finish();
  };

  return (
    <View style={styles.screen}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <Slide
            item={item}
            width={width}
            topInset={insets.top}
            bottomInset={insets.bottom + 150}
          />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      <Pressable
        onPress={finish}
        style={[styles.skip, { top: insets.top + spacing.sm }]}
        accessibilityRole="button"
        accessibilityLabel="Passer l'introduction"
      >
        <Text style={styles.skipText}>Passer</Text>
      </Pressable>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Dots count={SLIDES.length} active={index} />
        <Button label={isLast ? 'Commencer' : 'Continuer'} onPress={next} style={styles.action} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  slide: { flex: 1 },
  background: { flex: 1, width: '100%' },
  topBar: {
    paddingHorizontal: spacing.lg,
  },
  brandTop: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  kicker: {
    ...typography.kicker,
    color: colors.brandBright,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 340,
  },
  skip: {
    position: 'absolute',
    right: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    fontSize: 15,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  action: { width: '100%' },
});
