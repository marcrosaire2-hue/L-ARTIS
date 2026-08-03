import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsRestoring } from '../src/features/auth/authSlice';
import { hasSeenIntro } from '../src/lib/onboarding';
import { colors } from '../src/lib/theme';

/**
 * Écran d'ouverture : le logo animé, et rien d'autre.
 *
 * Aucun texte, aucun bouton — l'écran s'efface de lui-même. L'animation dure
 * le temps qu'il faut pour respirer, pas davantage : pendant qu'elle joue, la
 * session est restaurée en arrière-plan et la destination calculée. L'attente
 * perçue est donc « gratuite », elle recouvre un travail réel.
 *
 * On utilise l'API `Animated` intégrée : une simple séquence d'opacité et
 * d'échelle ne justifie pas d'ajouter Reanimated au projet.
 */
const HOLD_MS = 900;

export default function OpeningScreen() {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isRestoring = useSelector(selectIsRestoring);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.82)).current;
  const [animationDone, setAnimationDone] = useState(false);
  const [introSeen, setIntroSeen] = useState(null);

  useEffect(() => {
    // Le logo natif laisse place au logo animé — même image, même position,
    // la transition ne se voit pas.
    SplashScreen.hideAsync().catch(() => {});
    hasSeenIntro().then(setIntroSeen);

    Animated.sequence([
      // Apparition : le logo grandit légèrement en se révélant
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(HOLD_MS),
      // Disparition douce avant la bascule, pour éviter la coupure sèche
      Animated.timing(opacity, {
        toValue: 0,
        duration: 320,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => finished && setAnimationDone(true));
  }, [opacity, scale]);

  useEffect(() => {
    // On attend les DEUX : la fin de l'animation et la restauration de
    // session. Basculer avant la seconde afficherait brièvement l'écran de
    // connexion à quelqu'un qui est en réalité déjà connecté.
    if (!animationDone || isRestoring || introSeen === null) return;

    if (isAuthenticated) router.replace('/accueil');
    else router.replace(introSeen ? '/connexion' : '/intro');
  }, [animationDone, isRestoring, introSeen, isAuthenticated, router]);

  return (
    <View style={styles.screen}>
      <Animated.Image
        source={require('../assets/logo.png')}
        style={[styles.logo, { opacity, transform: [{ scale }] }]}
        resizeMode="contain"
        accessibilityLabel="L-ARTIS"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 200, height: 200 },
});

