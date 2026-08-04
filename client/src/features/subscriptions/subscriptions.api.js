import { api, unwrapData } from '../../app/api';

export const subscriptionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listPlans: builder.query({
      query: () => '/subscriptions/plans',
      transformResponse: unwrapData,
    }),
    getMySubscription: builder.query({
      query: () => '/subscriptions/me',
      transformResponse: unwrapData,
      providesTags: ['Subscription'],
    }),
    subscribe: builder.mutation({
      query: (body) => ({ url: '/subscriptions/me', method: 'POST', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Subscription', 'MyArtisan'],
    }),
    cancelSubscription: builder.mutation({
      query: () => ({ url: '/subscriptions/me', method: 'DELETE' }),
      transformResponse: unwrapData,
      invalidatesTags: ['Subscription', 'MyArtisan'],
    }),
  }),
});

export const {
  useListPlansQuery,
  useGetMySubscriptionQuery,
  useSubscribeMutation,
  useCancelSubscriptionMutation,
} = subscriptionsApi;
