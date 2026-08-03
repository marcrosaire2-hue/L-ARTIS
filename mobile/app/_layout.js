import { Provider } from 'react-redux';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { store } from '../src/store/store';
import { useSessionBootstrap } from '../src/features/auth/useSessionBootstrap';
import { colors } from '../src/lib/theme';

// Doit être appelé hors composant : au moment où React monte, l'écran natif
// est déjà en train de disparaître.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

/**
 * La restauration de session démarre ici, en parallèle de l'écran d'ouverture.
 * Elle ne bloque plus le rendu : c'est l'écran animé (app/index.js) qui décide
 * quand basculer, une fois son animation terminée ET la session résolue.
 */
function SessionBootstrap({ children }) {
  useSessionBootstrap();
  return children;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <SessionBootstrap>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'fade',
            }}
          />
        </SessionBootstrap>
      </SafeAreaProvider>
    </Provider>
  );
}
