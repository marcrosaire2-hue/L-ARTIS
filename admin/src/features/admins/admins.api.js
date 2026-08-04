import { api, unwrapData } from '../../app/api';

export const adminsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminMe: builder.query({
      query: () => ({ url: '/admin/me' }),
      transformResponse: unwrapData,
      providesTags: ['AdminMe'],
    }),
    listAdmins: builder.query({
      query: () => ({ url: '/admin/admins' }),
      transformResponse: unwrapData,
      providesTags: ['Admin'],
    }),
    createAdmin: builder.mutation({
      query: (body) => ({ url: '/admin/admins', method: 'POST', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Admin', 'User', 'Activity'],
    }),
  }),
});

export const { useGetAdminMeQuery, useListAdminsQuery, useCreateAdminMutation } = adminsApi;
