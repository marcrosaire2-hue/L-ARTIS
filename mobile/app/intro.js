import { useRef, useState } from 'react';
import { Dimensions, FlatList, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Dots } from '../src/components/ui';
import { markIntroSeen } from '../src/lib/onboarding';
import { colors, radius, spacing, typography } from '../src/lib/theme';

/**
 * Deux écrans de présentation, sur fond photo : ce que la plateforme apporte
 * aux clients, puis aux artisans. Volontairement courts — trois lignes
 * chacun. Une introduction longue est balayée sans être lue et retarde
 * l'inscription.
 */
const SLIDES = [
  {
    key: 'client',
    image: require('../assets/client.jpg'),
    badge: 'Vous cherchez un artisan',
    title: 'Trouvez le bon professionnel, près de chez vous',
    points: [
      'Recherchez par métier et par commune, partout au Bénin.',
      'Comparez les tarifs annoncés en FCFA et les avis des clients.',
      'Appelez directement l’artisan ou écrivez-lui sur WhatsApp.',
    ],
  },
  {
    key: 'artisan',
    image: require('../assets/artisan.jpg'),
    badge: 'Vous êtes artisan',
    title: 'Faites-vous connaître et recevez des demandes',
    points: [
      'Créez votre fiche en moins d’une minute, gratuitement.',
      'Ajoutez vos photos, vos prestations et vos tarifs.',
      'Recevez les demandes des clients de votre commune.',
    ],
  },
];

function Slide({ item, width, bottomInset }) {
  return (
    <View style={[styles.slide, { width }]}>
      <ImageBackground source={item.image} style={styles.background} resizeMode="cover">
        <View style={styles.overlay} />

        <View style={[styles.content, { paddingBottom: bottomInset }]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>

          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.points}>
            {item.points.map((point) => (
              <View key={point} style={styles.point}>
                <View style={styles.bullet} />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
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

  const next = async () => {
    if (!isLast) {
      // L'index avance ici, et pas seulement dans onMomentumScrollEnd :
      // cet événement ne se déclenche qu'au glissement de l'utilisateur,
      // jamais sur un défilement programmé — le bouton resterait bloqué
      // sur « Continuer » indéfiniment.
      setIndex(index + 1);
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      return;
    }
    await markIntroSeen();
    router.replace('/connexion');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <Slide item={item} width={width} bottomInset={insets.bottom + 170} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Dots count={SLIDES.length} active={index} />
        <Button
          label={isLast ? 'Commencer' : 'Continuer'}
          onPress={next}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  slide: { flex: 1 },
  background: { flex: 1, width: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 44, 30, 0.62)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  badgeText: { ...typography.small, color: '#ffffff', fontWeight: '600' },
  title: { ...typography.title, fontSize: 26, lineHeight: 34, color: '#ffffff', marginBottom: spacing.lg },
  points: { gap: spacing.md },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.brandLight,
    marginTop: 8,
  },
  pointText: { ...typography.body, color: 'rgba(255, 255, 255, 0.92)', flex: 1, lineHeight: 24 },
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
