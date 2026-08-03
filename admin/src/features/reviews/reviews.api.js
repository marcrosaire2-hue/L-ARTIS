import { api, unwrapData } from '../../app/api';

export const reviewsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listReviews: builder.query({
      query: (params) => ({ url: '/admin/reviews', params }),
      transformResponse: unwrapData,
      providesTags: ['Review'],
    }),
    setReviewStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/reviews/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      transformResponse: unwrapData,
      // La modération recalcule la note moyenne de l'artisan
      invalidatesTags: ['Review', 'Artisan'],
    }),
  }),
});

export const { useListReviewsQuery, useSetReviewStatusMutation } = reviewsApi;
