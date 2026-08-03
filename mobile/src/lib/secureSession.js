import * as SecureStore from 'expo-secure-store';

/**
 * Conservation du refresh token sur l'appareil.
 *
 * En navigateur, le jeton vit dans un cookie httpOnly qu'aucun script ne peut
 * lire. Une application native n'a pas cet abri : on le range donc dans le
 * trousseau du système (Keychain sur iOS, Keystore chiffré sur Android), qui
 * est isolé par application et survit à la fermeture — mais pas à la
 * désinstallation.
 *
 * `AsyncStorage` serait le mauvais choix ici : ses données sont stockées en
 * clair et lisibles sur un appareil rooté ou débridé.
 */
const REFRESH_KEY = 'artisans.refreshToken';

export async function saveRefreshToken(token) {
  if (!token) return;
  try {
    await SecureStore.setItemAsync(REFRESH_KEY, token, {
      // Le jeton n'est utile qu'appareil déverrouillé ; ce niveau évite
      // aussi qu'il soit repris par une restauration de sauvegarde.
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    /* Trousseau indisponible : la session durera le temps de l'exécution */
  }
}

export async function readRefreshToken() {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function clearRefreshToken() {
  try {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {
    /* rien à faire : l'absence de jeton est l'état recherché */
  }
}
