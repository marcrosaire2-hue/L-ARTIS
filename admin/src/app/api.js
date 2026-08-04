import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { credentialsReceived, sessionEnded } from '../features/auth/authSlice';

// Ancien hostname Render encore présent dans certains builds ; bascule vers sc17.
const resolveApiUrl = (url) => {
  const value = url || 'http://localhost:5000/api/v1';
  return value.replace(
    'https://lartis-api.onrender.com',
    'https://lartis-api-sc17.onrender.com'
  );
};
const baseUrl = resolveApiUrl(import.meta.env.VITE_API_URL);

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  // Indispensable : le refresh token voyage dans un cookie httpOnly
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

/**
 * Un seul refresh à la fois : si plusieurs requêtes se heurtent à un 401
 * simultanément (chargement d'une page qui appelle 3 endpoints), elles
 * attendent toutes le même appel plutôt que d'en déclencher trois — ce qui
 * ferait échouer les deux derniers, le serveur invalidant l'ancien token à
 * chaque rotation.
 */
let refreshInFlight = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === 'string' ? args : args.url;
  const isAuthRoute = url.startsWith('/auth/');

  if (result.error?.status === 401 && !isAuthRoute) {
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        const refreshed = await rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions);
        refreshInFlight = null;
        return refreshed;
      })();
    }

    const refreshResult = await refreshInFlight;
    const session = refreshResult.data?.data;

    if (session?.accessToken) {
      api.dispatch(credentialsReceived(session));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(sessionEnded());
    }
  }

  return result;
};

/**
 * Toutes les réponses de l'API suivent { success, statusCode, message, data }.
 * Les endpoints n'exposent donc que `data` aux composants.
 */
export const unwrapData = (response) => response?.data ?? null;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Artisan', 'User', 'Review', 'Category', 'Trade'],
  endpoints: () => ({}),
});
