import { api, unwrapData } from '../../app/api';

export const uploadsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadMedia: builder.mutation({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/uploads', method: 'POST', body };
      },
      transformResponse: unwrapData,
    }),
  }),
});

export const { useUploadMediaMutation } = uploadsApi;
