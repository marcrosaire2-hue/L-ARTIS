import { api, unwrapData } from '../../app/api';

export const catalogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCategories: builder.query({
      query: () => '/categories',
      transformResponse: unwrapData,
      providesTags: ['Category'],
    }),
    listTrades: builder.query({
      query: (params) => ({ url: '/categories/trades', params }),
      transformResponse: unwrapData,
      providesTags: ['Trade'],
    }),
    createCategory: builder.mutation({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Category', 'Activity'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PUT', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Category', 'Activity'],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category', 'Activity'],
    }),
    createTrade: builder.mutation({
      query: (body) => ({ url: '/categories/trades/create', method: 'POST', body }),
      transformResponse: unwrapData,
      // Le nombre de métiers est stocké sur la catégorie
      invalidatesTags: ['Trade', 'Category', 'Activity'],
    }),
    updateTrade: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/categories/trades/${id}`, method: 'PUT', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Trade', 'Category', 'Activity'],
    }),
    deleteTrade: builder.mutation({
      query: (id) => ({ url: `/categories/trades/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Trade', 'Category', 'Activity'],
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useListTradesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateTradeMutation,
  useUpdateTradeMutation,
  useDeleteTradeMutation,
} = catalogApi;
