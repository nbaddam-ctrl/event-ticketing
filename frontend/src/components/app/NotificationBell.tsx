import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationPanel } from './NotificationPanel';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationResponse,
} from '@/services/notificationApi';

const POLL_INTERVAL_MS = 1_000;

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Poll unread count
  const pollUnread = useCallback(async () => {
    try {
      const { unreadCount: count } = await fetchUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silently ignore polling errors
    }
  }, []);

  useEffect(() => {
    pollUnread();
    const interval = setInterval(pollUnread, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pollUnread]);

  // Load notifications when panel opens
  const loadNotifications = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true);
    try {
      const result = await fetchNotifications(pageNum, 20);
      setNotifications((prev) => append ? [...prev, ...result.notifications] : result.notifications);
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch {
      // Silently ignore load errors
    } finally {
      setLoading(false);
    }
  }, []);

  function handleToggle() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      loadNotifications(1, false);
    }
  }

  function handleLoadMore() {
    loadNotifications(page + 1, true);
  }

  async function handleMarkRead(id: string) {
    // Optimistic update — reflect in UI instantly
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationRead(id);
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false, readAt: null } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  }

  async function handleMarkAllRead() {
    // Optimistic update — reflect in UI instantly
    const prevNotifications = notifications;
    const prevCount = unreadCount;
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      // Revert on failure
      setNotifications(prevNotifications);
      setUnreadCount(prevCount);
    }
  }

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={handleToggle}
        className={cn(
          'relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
          isOpen && 'bg-accent text-accent-foreground'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          hasMore={hasMore}
          loading={loading}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onLoadMore={handleLoadMore}
        />
      )}
    </div>
  );
}
