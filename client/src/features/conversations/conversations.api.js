import { api, unwrapData } from '../../app/api';

export const conversationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listConversations: builder.query({
      query: (params) => ({ url: '/conversations', params }),
      transformResponse: unwrapData,
      providesTags: ['Conversation'],
    }),
    openConversation: builder.mutation({
      query: (body) => ({ url: '/conversations', method: 'POST', body }),
      transformResponse: unwrapData,
      invalidatesTags: ['Conversation'],
    }),
    getConversation: builder.query({
      query: (id) => `/conversations/${id}`,
      transformResponse: unwrapData,
      providesTags: (_r, _e, id) => [{ type: 'Conversation', id }],
    }),
    listMessages: builder.query({
      query: ({ id, ...params }) => ({ url: `/conversations/${id}/messages`, params }),
      transformResponse: unwrapData,
      providesTags: (_r, _e, { id }) => [{ type: 'Conversation', id }],
    }),
    sendMessage: builder.mutation({
      query: ({ id, content }) => ({
        url: `/conversations/${id}/messages`,
        method: 'POST',
        body: { content },
      }),
      transformResponse: unwrapData,
      invalidatesTags: ['Conversation', 'Notification'],
    }),
  }),
});

export const {
  useListConversationsQuery,
  useOpenConversationMutation,
  useGetConversationQuery,
  useListMessagesQuery,
  useSendMessageMutation,
} = conversationsApi;
