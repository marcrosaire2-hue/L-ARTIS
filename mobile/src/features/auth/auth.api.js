import { api, unwrapData } from '../../store/api';
import { clearRefreshToken, saveRefreshToken } from '../../lib/secureSession';

/**
 * Le serveur renvoie le refresh token dans le corps quand il reconnaît le
 * client mobile (en-tête x-client-type). La persistance se fait ici, et non
 * dans chaque écran : un oubli côté écran déconnecterait l'utilisateur au
 * lancement suivant sans que rien ne le signale.
 */
const persistSession = async (_arg, { queryFulfilled }) => {
  try {
    const { data } = await queryFulfilled;
    if (data?.refreshToken) await saveRefreshToken(data.refreshToken);
  } catch {
    /* l'erreur est traitée par l'appelant */
  }
};

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: unwrapData,
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: unwrapData,
      onQueryStarted: persistSession,
    }),
    refresh: builder.mutation({
      query: (refreshToken) => ({ url: '/auth/refresh', method: 'POST', body: { refreshToken } }),
      transformResponse: unwrapData,
      onQueryStarted: persistSession,
    }),
    logout: builder.mutation({
      query: (refreshToken) => ({ url: '/auth/logout', method: 'POST', body: { refreshToken } }),
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        // Le jeton local part dans tous les cas : l'utilisateur a demandé
        // à être déconnecté, un appel en échec ne doit pas l'en empêcher.
        try {
          await queryFulfilled;
        } finally {
          await clearRefreshToken();
        }
      },
    }),
    forgotPassword: builder.mutation({
      query: (identifier) => ({ url: '/auth/forgot-password', method: 'POST', body: { identifier } }),
      transformResponse: unwrapData,
    }),
    deleteAccount: builder.mutation({
      query: (password) => ({ url: '/auth/me', method: 'DELETE', body: { password } }),
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        await queryFulfilled;
        await clearRefreshToken();
      },
    }),
    me: builder.query({
      query: () => '/auth/me',
      transformResponse: unwrapData,
      providesTags: ['Me'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useDeleteAccountMutation,
  useMeQuery,
} = authApi;
