import { api, unwrapData } from '../../store/api';

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createReport: builder.mutation({
      query: (body) => ({ url: '/reports', method: 'POST', body }),
      transformResponse: unwrapData,
    }),
  }),
});

export const { useCreateReportMutation } = reportsApi;
