import { api, unwrapData } from '../../app/api';

export const activitiesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listActivities: builder.query({
      query: (params) => ({ url: '/admin/activities', params }),
      transformResponse: unwrapData,
      providesTags: ['Activity'],
    }),
  }),
});

export const { useListActivitiesQuery } = activitiesApi;
