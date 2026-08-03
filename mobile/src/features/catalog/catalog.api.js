import { api, unwrapData } from '../../store/api';

export const catalogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCategories: builder.query({
      query: () => '/categories',
      transformResponse: unwrapData,
    }),
    listTrades: builder.query({
      // limit=50 est le plafond serveur ; suffisant par catégorie
      query: (params) => ({ url: '/categories/trades', params: { limit: 50, ...params } }),
      transformResponse: unwrapData,
    }),
    // Géographie du Bénin : départements -> communes -> quartiers
    listDepartments: builder.query({
      query: () => '/locations',
      transformResponse: unwrapData,
    }),
    listDistricts: builder.query({
      query: (commune) => ({ url: '/locations/districts', params: { commune } }),
      transformResponse: unwrapData,
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useListTradesQuery,
  useListDepartmentsQuery,
  useListDistrictsQuery,
} = catalogApi;
