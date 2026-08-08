import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MessageCircle } from 'lucide-react';
import { selectUser } from '../features/auth/authSlice';
import {
  useGetConversationQuery,
  useListConversationsQuery,
  useListMessagesQuery,
  useOpenConversationMutation,
  useSendMessageMutation,
} from '../features/conversations/conversations.api';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  Field,
  Loading,
  Textarea,
} from '../components/ui';
import { errorMessage, fullName, initials, timeAgo } from '../lib/format';

function ConversationThread({ conversationId }) {
  const user = useSelector(selectUser);
  const { data: conversation } = useGetConversationQuery(conversationId);
  const { data: messagesData, isLoading } = useListMessagesQuery({ id: conversationId });
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  const messages = messagesData?.items ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const submit = async (event) => {
    event.preventDefault();
    const text = content.trim();
    if (!text) return;
    setError(null);
    try {
      await sendMessage({ id: conversationId, content: text }).unwrap();
      setContent('');
    } catch (sendError) {
      setError(errorMessage(sendError, "Le message n'a pas pu être envoyé."));
    }
  };

  if (isLoading) return <Loading label="Chargement de la conversation…" />;

  const title =
    conversation?.artisan?.displayName ||
    conversation?.otherParticipant?.firstName ||
    'Conversation';

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col md:h-[calc(100vh-10rem)]">
      <div className="border-b border-slate-200 pb-3">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {conversation?.artisan?.artisanId && (
          <Link
            to={`/artisans/${conversation.artisan.artisanId}`}
            className="text-sm text-brand-700 hover:underline"
          >
            Voir la fiche artisan
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            Aucun message. Envoyez le premier !
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => {
              const mine = String(message.sender?._id ?? message.sender) === String(user?.id);
              return (
                <div
                  key={message._id}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      mine
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`mt-1 text-xs ${mine ? 'text-brand-100' : 'text-slate-400'}`}
                    >
                      {timeAgo(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="border-t border-slate-200 pt-4">
        {error && (
          <div className="mb-3">
            <Alert>{error}</Alert>
          </div>
        )}
        <Field label="Votre message">
          <Textarea
            rows={2}
            maxLength={4000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez votre message…"
          />
        </Field>
        <Button type="submit" loading={sending} disabled={!content.trim()} className="mt-2">
          Envoyer
        </Button>
      </form>
    </div>
  );
}

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('c') || '';
  const openArtisanId = searchParams.get('artisanId') || '';

  const { data, isLoading } = useListConversationsQuery();
  const [openConversation, { isLoading: opening }] = useOpenConversationMutation();
  const [openError, setOpenError] = useState(null);

  const items = data?.items ?? [];

  useEffect(() => {
    if (!openArtisanId || selectedId) return;
    setOpenError(null);
    openConversation({ artisanId: openArtisanId })
      .unwrap()
      .then((conv) => {
        setSearchParams({ c: conv._id }, { replace: true });
      })
      .catch((err) => {
        setOpenError(errorMessage(err, "Impossible d'ouvrir la conversation."));
      });
  }, [openArtisanId, selectedId, openConversation, setSearchParams]);

  if (isLoading || (openArtisanId && !selectedId && opening)) {
    return <Loading label="Chargement des messages…" />;
  }

  return (
    <Container className="py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Messages</h1>

      {openError && (
        <div className="mb-4">
          <Alert>{openError}</Alert>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,18rem)_1fr]">
        <aside>
          {items.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="Aucune conversation"
              description="Contactez un artisan depuis sa fiche pour démarrer un échange."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((conv) => {
                const label =
                  conv.artisan?.displayName ||
                  fullName(conv.otherParticipant) ||
                  'Conversation';
                const active = conv._id === selectedId;
                const unread = conv.unreadCount > 0;

                return (
                  <button
                    key={conv._id}
                    type="button"
                    onClick={() => setSearchParams({ c: conv._id })}
                    className={`rounded-xl px-4 py-3 text-left transition-colors ${
                      active
                        ? 'bg-brand-50 ring-1 ring-brand-200'
                        : 'bg-white ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                        {initials(label)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">{label}</p>
                        {conv.lastMessage?.content && (
                          <p className="truncate text-xs text-slate-500">
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {unread && <Badge tone="green">{conv.unreadCount}</Badge>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <Card className="min-h-[20rem] p-5">
          {selectedId ? (
            <ConversationThread conversationId={selectedId} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <MessageCircle className="size-10 text-slate-300" aria-hidden="true" />
              <p className="mt-3 text-slate-600">Sélectionnez une conversation</p>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}
