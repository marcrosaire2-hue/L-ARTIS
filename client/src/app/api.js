import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { credentialsReceived, sessionEnded } from '../features/auth/authSlice';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  // Le refresh token voyage dans un cookie httpOnly
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

/**
 * Un seul refresh à la fois. Le serveur fait tourner le refresh token à
 * chaque usage et traite la réutilisation d'un ancien token comme un vol :
 * sans ce verrou, une page lançant plusieurs requêtes expirées simultanément
 * déclencherait autant de refresh, dont tous sauf un rejoueraient un token
 * périmé — et feraient révoquer toutes les sessions de l'utilisateur.
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

    const session = (await refreshInFlight).data?.data;

    if (session?.accessToken) {
      api.dispatch(credentialsReceived(session));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(sessionEnded());
    }
  }

  return result;
};

/** Toutes les réponses suivent { success, statusCode, message, data }. */
export const unwrapData = (response) => response?.data ?? null;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me', 'Artisan', 'MyArtisan', 'Service', 'Gallery', 'Quote', 'Favorite', 'Review'],
  endpoints: () => ({}),
});
