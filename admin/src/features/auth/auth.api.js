import { api, unwrapData } from '../../app/api';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({ url: '/auth/login', method: 'POST', body: credentials }),
      transformResponse: unwrapData,
    }),
    // Rejoue le cookie httpOnly pour restaurer la session au démarrage
    refresh: builder.mutation({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
      transformResponse: unwrapData,
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    me: builder.query({
      query: () => '/auth/me',
      transformResponse: unwrapData,
    }),
  }),
});

export const { useLoginMutation, useRefreshMutation, useLogoutMutation, useMeQuery } = authApi;
