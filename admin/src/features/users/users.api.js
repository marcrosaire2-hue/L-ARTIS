import { api, unwrapData } from '../../app/api';

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query({
      query: (params) => ({ url: '/admin/users', params }),
      transformResponse: unwrapData,
      providesTags: ['User'],
    }),
    setUserStatus: builder.mutation({
      query: ({ id, status, reason }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PUT',
        body: { status, reason },
      }),
      transformResponse: unwrapData,
      // Réactiver un compte republie son profil artisan
      invalidatesTags: ['User', 'Artisan'],
    }),
    // Seule voie de récupération pour un compte sans e-mail
    resetUserPassword: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/password`, method: 'PUT' }),
      transformResponse: unwrapData,
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User', 'Artisan', 'Review'],
    }),
  }),
});

export const {
  useListUsersQuery,
  useSetUserStatusMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
} = usersApi;
