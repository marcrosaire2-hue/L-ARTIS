import { api, unwrapData } from '../../app/api';

export const artisansApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /* --- Public --- */
    searchArtisans: builder.query({
      query: (params) => ({ url: '/artisans', params }),
      transformResponse: unwrapData,
      providesTags: ['Artisan'],
    }),
    getArtisan: builder.query({
      query: (artisanId) => `/artisans/${artisanId}`,
      transformResponse: unwrapData,
      providesTags: ['Artisan'],
    }),
    listArtisanReviews: builder.query({
      query: ({ artisanId, ...params }) => ({ url: `/artisans/${artisanId}/reviews`, params }),
      transformResponse: unwrapData,
      providesTags: ['Review'],
    }),

    /* --- Espace artisan --- */
    getMyArtisan: builder.query({
      query: () => '/artisans/me',
      transformResponse: unwrapData,
      providesTags: ['MyArtisan'],
    }),
    updateMyProfile: builder.mutation({
      query: (body) => ({ url: '/artisans/me/profile', method: 'PUT', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['MyArtisan', 'Artisan'],
    }),
    getMyStats: builder.query({
      query: () => '/artisans/me/stats',
      transformResponse: unwrapData,
    }),
    listMyServices: builder.query({
      query: () => '/artisans/me/services',
      transformResponse: unwrapData,
      providesTags: ['Service'],
    }),
    createMyService: builder.mutation({
      query: (body) => ({ url: '/artisans/me/services', method: 'POST', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Service'],
    }),
    updateMyService: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/artisans/services/${id}`, method: 'PUT', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Service'],
    }),
    deleteMyService: builder.mutation({
      query: (id) => ({ url: `/artisans/services/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Service'],
    }),
    addGalleryMedia: builder.mutation({
      query: (body) => ({ url: '/artisans/me/gallery/media', method: 'POST', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Gallery'],
    }),
    removeGalleryItem: builder.mutation({
      query: (itemId) => ({ url: `/artisans/me/gallery/items/${itemId}`, method: 'DELETE' }),
      transformResponse: unwrapData,
      invalidatesTags: ['Gallery'],
    }),

    /* --- Médias --- */
    uploadMedia: builder.mutation({
      // FormData : ne pas fixer Content-Type, le navigateur ajoute la boundary
      query: (file) => {
        const form = new FormData();
        form.append('file', file);
        return { url: '/uploads', method: 'POST', body: form };
      },
      transformResponse: unwrapData,
    }),
  }),
});

export const {
  useSearchArtisansQuery,
  useGetArtisanQuery,
  useListArtisanReviewsQuery,
  useGetMyArtisanQuery,
  useUpdateMyProfileMutation,
  useGetMyStatsQuery,
  useListMyServicesQuery,
  useCreateMyServiceMutation,
  useUpdateMyServiceMutation,
  useDeleteMyServiceMutation,
  useAddGalleryMediaMutation,
  useRemoveGalleryItemMutation,
  useUploadMediaMutation,
} = artisansApi;
