import { api, unwrapData } from '../../app/api';

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listReports: builder.query({
      query: (params) => ({ url: '/admin/reports', params }),
      transformResponse: unwrapData,
      providesTags: ['Report'],
    }),
    handleReport: builder.mutation({
      query: ({ id, status, resolutionNote }) => ({
        url: `/admin/reports/${id}`,
        method: 'PUT',
        body: { status, resolutionNote },
      }),
      transformResponse: unwrapData,
      invalidatesTags: ['Report', 'Activity'],
    }),
  }),
});

export const { useListReportsQuery, useHandleReportMutation } = reportsApi;
