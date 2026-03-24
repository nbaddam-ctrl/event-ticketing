import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Ticket,
  AlertTriangle,
  ArrowUpCircle,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationResponse, NotificationType } from '@/services/notificationApi';

const typeConfig: Record<NotificationType, { icon: LucideIcon; colorClass: string }> = {
  organizer_request_submitted: { icon: UserCheck, colorClass: 'text-info' },
  organizer_request_approved: { icon: CheckCircle, colorClass: 'text-success' },
  organizer_request_rejected: { icon: XCircle, colorClass: 'text-destructive' },
  booking_confirmed: { icon: Ticket, colorClass: 'text-success' },
  event_cancelled: { icon: AlertTriangle, colorClass: 'text-destructive' },
  waitlist_promoted: { icon: ArrowUpCircle, colorClass: 'text-info' },
  waitlist_expired: { icon: Clock, colorClass: 'text-warning' },
};

interface NotificationItemProps {
  notification: NotificationResponse;
  onMarkRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const navigate = useNavigate();
  const config = typeConfig[notification.type] ?? { icon: Clock, colorClass: 'text-muted-foreground' };
  const Icon = config.icon;

  function handleClick() {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    if (notification.navigationPath) {
      navigate(notification.navigationPath);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent',
        !notification.isRead && 'bg-accent/50'
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.colorClass)} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm leading-snug',
            notification.isRead ? 'text-muted-foreground' : 'font-medium text-foreground'
          )}
        >
          {notification.message}
        </p>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}
