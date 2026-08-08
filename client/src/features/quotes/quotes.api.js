import { api, unwrapData } from '../../app/api';

export const quotesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listMyQuotes: builder.query({
      query: (params) => ({ url: '/quotes/me', params }),
      transformResponse: unwrapData,
      providesTags: ['Quote'],
    }),
    listArtisanQuotes: builder.query({
      query: (params) => ({ url: '/artisans/me/quotes', params }),
      transformResponse: unwrapData,
      providesTags: ['Quote'],
    }),
    getQuote: builder.query({
      query: (id) => `/quotes/${id}`,
      transformResponse: unwrapData,
      providesTags: (_r, _e, id) => [{ type: 'Quote', id }],
    }),
    createQuote: builder.mutation({
      query: (body) => ({ url: '/quotes', method: 'POST', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Quote', 'Notification'],
    }),
    respondToQuote: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/quotes/${id}/respond`, method: 'PUT', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Quote', 'Notification'],
    }),
    updateQuoteStatus: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/quotes/${id}/status`, method: 'PUT', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Quote', 'Notification'],
    }),
  }),
});

export const {
  useListMyQuotesQuery,
  useListArtisanQuotesQuery,
  useGetQuoteQuery,
  useCreateQuoteMutation,
  useRespondToQuoteMutation,
  useUpdateQuoteStatusMutation,
} = quotesApi;
