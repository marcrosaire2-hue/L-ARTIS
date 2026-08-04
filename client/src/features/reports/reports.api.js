import { api, unwrapData } from '../../app/api';

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createReport: builder.mutation({
      query: (body) => ({ url: '/reports', method: 'POST', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Report'],
    }),
  }),
});

export const { useCreateReportMutation } = reportsApi;
