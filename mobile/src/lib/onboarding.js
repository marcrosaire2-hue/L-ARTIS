import * as SecureStore from 'expo-secure-store';

/**
 * Mémorise que l'utilisateur a vu les écrans d'introduction.
 *
 * Sans ce drapeau, la présentation reviendrait à chaque lancement — ce que
 * personne ne supporte au-delà de la deuxième fois.
 *
 * Le trousseau sécurisé n'est pas l'outil naturel pour une donnée non
 * sensible ; il est retenu ici parce qu'il est déjà en place pour le refresh
 * token, ce qui évite une dépendance de plus. Si d'autres préférences
 * apparaissent, `@react-native-async-storage/async-storage` sera plus adapté.
 */
// v3 : design type Monpermis (voile navy, CTA pilule, Passer).
const SEEN_KEY = 'artisans.introSeen.v3';

export async function hasSeenIntro() {
  try {
    return (await SecureStore.getItemAsync(SEEN_KEY)) === '1';
  } catch {
    // En cas d'échec on considère l'introduction comme vue : mieux vaut la
    // sauter à tort que de l'imposer en boucle.
    return true;
  }
}

export async function markIntroSeen() {
  try {
    await SecureStore.setItemAsync(SEEN_KEY, '1');
  } catch {
    /* sans persistance, l'introduction réapparaîtra — sans gravité */
  }
}
