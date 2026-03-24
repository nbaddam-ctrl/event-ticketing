import { apiRequest } from './apiClient';

export type NotificationType =
  | 'organizer_request_submitted'
  | 'organizer_request_approved'
  | 'organizer_request_rejected'
  | 'booking_confirmed'
  | 'event_cancelled'
  | 'waitlist_promoted'
  | 'waitlist_expired';

export interface NotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  referenceId: string | null;
  referenceType: string | null;
  navigationPath: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export async function fetchNotifications(page: number = 1, limit: number = 20): Promise<NotificationListResponse> {
  return apiRequest<NotificationListResponse>(`/notifications?page=${page}&limit=${limit}`);
}

export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  return apiRequest<UnreadCountResponse>('/notifications/unread-count');
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiRequest<void>(`/notifications/${notificationId}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest<void>('/notifications/read-all', { method: 'PATCH' });
}
