import { api, unwrapData } from '../../app/api';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: unwrapData,
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: unwrapData,
    }),
    refresh: builder.mutation({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
      transformResponse: unwrapData,
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    verifyEmail: builder.mutation({
      query: (token) => ({ url: '/auth/verify-email', method: 'POST', body: { token } }),
      transformResponse: unwrapData,
    }),
    forgotPassword: builder.mutation({
      // Le serveur attend `identifier` : téléphone ou e-mail
      query: (identifier) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: { identifier },
      }),
      transformResponse: unwrapData,
    }),
    resetPassword: builder.mutation({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    // Suppression définitive, confirmée par le mot de passe
    deleteAccount: builder.mutation({
      query: (password) => ({ url: '/auth/me', method: 'DELETE', body: { password } }),
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
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useMeQuery,
  useDeleteAccountMutation,
} = authApi;
