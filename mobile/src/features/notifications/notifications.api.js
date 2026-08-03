import { api, unwrapData } from '../../store/api';

export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query({
      query: (params) => ({ url: '/notifications/me', params }),
      transformResponse: unwrapData,
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PUT' }),
      transformResponse: unwrapData,
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: '/notifications/me/read-all', method: 'PUT' }),
      transformResponse: unwrapData,
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;