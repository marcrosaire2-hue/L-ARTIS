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
      query: ({ code, email }) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body: { code, email },
      }),
      transformResponse: unwrapData,
      invalidatesTags: ['Me'],
    }),
    resendVerification: builder.mutation({
      query: (email) => ({
        url: '/auth/resend-verification',
        method: 'POST',
        body: { email },
      }),
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
    changePassword: builder.mutation({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
      transformResponse: unwrapData,
    }),
    acceptTerms: builder.mutation({
      query: () => ({ url: '/auth/accept-terms', method: 'POST' }),
      transformResponse: unwrapData,
      invalidatesTags: ['Me'],
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
  useResendVerificationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useMeQuery,
  useDeleteAccountMutation,
  useChangePasswordMutation,
  useAcceptTermsMutation,
} = authApi;
