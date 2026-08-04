import { api, unwrapData } from '../../app/api';
import { getBeninDepartments, getBeninDistricts } from '../../lib/beninGeography';

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
      transformResponse: (response) => {
        const data = unwrapData(response);
        if (Array.isArray(data) && data.length > 0) return data;
        return getBeninDepartments();
      },
    }),
    listDistricts: builder.query({
      query: (commune) => ({ url: '/locations/districts', params: { commune } }),
      transformResponse: (response, _meta, commune) => {
        const data = unwrapData(response);
        if (Array.isArray(data) && data.length > 0) return data;
        return getBeninDistricts(commune);
      },
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useListTradesQuery,
  useListDepartmentsQuery,
  useListDistrictsQuery,
} = catalogApi;
