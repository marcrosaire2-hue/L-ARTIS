import { api, unwrapData } from '../../store/api';

export const favoritesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listFavorites: builder.query({
      query: (params) => ({ url: '/favorites/me', params }),
      transformResponse: unwrapData,
      providesTags: ['Favorite'],
    }),
    addFavorite: builder.mutation({
      query: (artisanId) => ({ url: '/favorites', method: 'POST', body: { artisanId } }),
      transformResponse: unwrapData,
      invalidatesTags: ['Favorite'],
    }),
    removeFavorite: builder.mutation({
      query: (artisanId) => ({ url: `/favorites/${artisanId}`, method: 'DELETE' }),
      invalidatesTags: ['Favorite'],
    }),
  }),
});

export const {
  useListFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = favoritesApi;
