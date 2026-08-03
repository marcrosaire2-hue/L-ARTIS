import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsRestoring } from '../src/features/auth/authSlice';
import { hasSeenIntro } from '../src/lib/onboarding';
import { colors } from '../src/lib/theme';

/**
 * Splash crème style Monpermis : logo fade+scale+rise, wordmark lettre
 * par lettre, puis bascule sans fade-out (évite le flash blanc).
 */
const LETTERS = ['L', '-', 'A', 'R', 'T', 'I', 'S'];
const HOLD_MS = 700;

export default function OpeningScreen() {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isRestoring = useSelector(selectIsRestoring);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.96)).current;
  const logoTranslate = useRef(new Animated.Value(14)).current;
  const letterAnims = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  const [animationDone, setAnimationDone] = useState(false);
  const [introSeen, setIntroSeen] = useState(null);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    hasSeenIntro().then(setIntroSeen);

    const letterStagger = LETTERS.map((_, index) =>
      Animated.timing(letterAnims[index], {
        toValue: 1,
        duration: 420,
        delay: index * 45,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );

    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslate, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel(letterStagger),
      Animated.delay(HOLD_MS),
    ]).start(({ finished }) => finished && setAnimationDone(true));

    // Garde-fou Monpermis : ne jamais bloquer plus de ~5,5 s
    const safety = setTimeout(() => setAnimationDone(true), 5500);
    return () => clearTimeout(safety);
  }, [logoOpacity, logoScale, logoTranslate, letterAnims]);

  useEffect(() => {
    if (!animationDone || isRestoring || introSeen === null) return;
    if (isAuthenticated) router.replace('/accueil');
    else router.replace(introSeen ? '/connexion' : '/intro');
  }, [animationDone, isRestoring, introSeen, isAuthenticated, router]);

  return (
    <View style={styles.screen}>
      <View style={styles.glow} />
      <Animated.Image
        source={require('../assets/logo.png')}
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: logoTranslate }],
          },
        ]}
        resizeMode="contain"
        accessibilityLabel="L-ARTIS"
      />
      <View style={styles.wordmark} accessible accessibilityLabel="L-ARTIS">
        {LETTERS.map((letter, index) => (
          <Animated.Text
            key={`${letter}-${index}`}
            style={[
              styles.letter,
              letter === '-' && styles.letterDash,
              {
                opacity: letterAnims[index],
                transform: [
                  {
                    translateY: letterAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  logo: { width: 168, height: 168, marginBottom: 18 },
  wordmark: { flexDirection: 'row', alignItems: 'flex-end' },
  letter: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 1,
  },
  letterDash: { color: colors.brand, marginHorizontal: 1 },
});
