import { NotificationItem } from './NotificationItem';
import { CheckCheck, Bell } from 'lucide-react';
import type { NotificationResponse } from '@/services/notificationApi';

interface NotificationPanelProps {
  notifications: NotificationResponse[];
  hasMore: boolean;
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onLoadMore: () => void;
}

export function NotificationPanel({
  notifications,
  hasMore,
  loading,
  onMarkRead,
  onMarkAllRead,
  onLoadMore,
}: NotificationPanelProps) {
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border bg-popover shadow-xl sm:w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        {hasUnread && (
          <button
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Bell className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={onMarkRead}
              />
            ))}
          </div>
        )}

        {loading && (
          <div className="py-4 text-center text-xs text-muted-foreground">Loading...</div>
        )}
      </div>

      {/* Load more */}
      {hasMore && !loading && (
        <div className="border-t px-4 py-2">
          <button
            onClick={onLoadMore}
            className="w-full rounded-md py-1.5 text-center text-xs font-medium text-primary transition-colors hover:bg-accent"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
