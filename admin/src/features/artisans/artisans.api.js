import { api, unwrapData } from '../../app/api';

export const artisansApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listArtisans: builder.query({
      query: (params) => ({ url: '/admin/artisans', params }),
      transformResponse: unwrapData,
      providesTags: ['Artisan'],
    }),
    setArtisanStatus: builder.mutation({
      query: ({ id, status, reason }) => ({
        url: `/admin/artisans/${id}/status`,
        method: 'PUT',
        body: { status, reason },
      }),
      transformResponse: unwrapData,
      // Valider un artisan modifie aussi accountStatus côté User
      invalidatesTags: ['Artisan', 'User', 'Activity'],
    }),
  }),
});

export const { useListArtisansQuery, useSetArtisanStatusMutation } = artisansApi;
