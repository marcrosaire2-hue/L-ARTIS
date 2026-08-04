import { Bell } from 'lucide-react';
import {
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../features/notifications/notifications.api';
import {
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  Loading,
} from '../components/ui';
import { timeAgo } from '../lib/format';

export default function NotificationsPage() {
  const { data, isLoading } = useListNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  const items = data?.items ?? [];
  const unread = items.filter((n) => !n.isRead).length;

  if (isLoading) return <Loading label="Chargement des notifications…" />;

  return (
    <Container className="py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
          {unread > 0 && (
            <p className="mt-1 text-sm text-slate-600">
              {unread} non lue{unread > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" loading={markingAll} onClick={() => markAll()}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune notification"
          description="Vous serez informé des nouveaux devis, messages et mises à jour."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((notification) => (
            <Card
              key={notification._id}
              className={`p-4 ${!notification.isRead ? 'ring-brand-200 bg-brand-50/30' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{notification.title}</p>
                  {notification.body && (
                    <p className="mt-1 text-sm text-slate-600">{notification.body}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">{timeAgo(notification.createdAt)}</p>
                </div>
                {!notification.isRead && (
                  <Badge tone="green">Nouveau</Badge>
                )}
              </div>
              {!notification.isRead && (
                <button
                  type="button"
                  onClick={() => markRead(notification._id)}
                  className="mt-2 text-sm font-medium text-brand-700 hover:underline"
                >
                  Marquer comme lu
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
