import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Constants from 'expo-constants';
import { credentialsReceived, sessionEnded } from '../features/auth/authSlice';
import { clearRefreshToken, readRefreshToken, saveRefreshToken } from '../lib/secureSession';

/**
 * Sur un téléphone, « localhost » désigne le téléphone lui-même : l'adresse
 * de l'API doit être celle de la machine de développement sur le réseau
 * local. Expo l'expose dans hostUri, on en reprend l'hôte.
 */
function resolveBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured;

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:5000/api/v1` : 'http://localhost:5000/api/v1';
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: resolveBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    // Indique au serveur de remettre le refresh token dans le corps de la
    // réponse : une application native n'a pas de cookie pour le recevoir.
    headers.set('x-client-type', 'mobile');
    const token = getState().auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

/**
 * Un seul rafraîchissement à la fois. Le serveur fait tourner le refresh
 * token à chaque usage et traite le rejeu d'un ancien jeton comme un vol :
 * sans ce verrou, un écran lançant plusieurs requêtes expirées ferait
 * révoquer toutes les sessions de l'utilisateur.
 */
let refreshInFlight = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status !== 401 || url.startsWith('/auth/')) return result;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const stored = await readRefreshToken();
      if (!stored) return null;
      const refreshed = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST', body: { refreshToken: stored } },
        api,
        extraOptions
      );
      refreshInFlight = null;
      return refreshed;
    })();
  }

  const session = (await refreshInFlight)?.data?.data;

  if (session?.accessToken) {
    await saveRefreshToken(session.refreshToken);
    api.dispatch(credentialsReceived(session));
    result = await rawBaseQuery(args, api, extraOptions);
  } else {
    await clearRefreshToken();
    api.dispatch(sessionEnded());
  }

  return result;
};

/** Toutes les réponses suivent { success, statusCode, message, data }. */
export const unwrapData = (response) => response?.data ?? null;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Me',
    'Artisan',
    'MyArtisan',
    'Service',
    'Gallery',
    'Quote',
    'Favorite',
    'Review',
    'Notification',
    'Conversation',
    'Message',
    'Subscription',
  ],
  endpoints: () => ({}),
});
