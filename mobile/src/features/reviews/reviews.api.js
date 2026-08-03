import { api, unwrapData } from '../../store/api';

export const reviewsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createReview: builder.mutation({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
      transformResponse: unwrapData,
      // La note moyenne de la fiche change dès que l'avis est publié
      invalidatesTags: ['Review', 'Artisan'],
    }),
    replyToReview: builder.mutation({
      query: ({ id, text }) => ({ url: `/reviews/${id}/reply`, method: 'PUT', body: { text } }),
      transformResponse: unwrapData,
      invalidatesTags: ['Review'],
    }),
  }),
});

export const { useCreateReviewMutation, useReplyToReviewMutation } = reviewsApi;
