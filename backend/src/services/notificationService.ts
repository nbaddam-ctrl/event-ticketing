import { z } from 'zod';
import { db } from '../db/client.js';
import { ApiError } from '../api/errors.js';
import { validateBody } from '../api/validation.js';
import type { NotificationType, NotificationReferenceType } from '../domain/types.js';
import {
  insertNotification,
  findByUserId,
  countUnreadByUserId,
  markReadById,
  markAllReadByUserId,
  type InsertNotificationInput,
} from '../repositories/notificationRepository.js';

const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum([
    'organizer_request_submitted',
    'organizer_request_approved',
    'organizer_request_rejected',
    'booking_confirmed',
    'booking_cancelled',
    'event_cancelled',
    'waitlist_promoted',
    'waitlist_expired',
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  referenceId: z.string().uuid().optional().nullable(),
  referenceType: z.enum(['event', 'booking', 'organizer_request', 'waitlist_entry']).optional().nullable(),
  navigationPath: z.string().startsWith('/').optional().nullable(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

/**
 * Create a single notification. Fire-and-forget — caller should wrap in try/catch.
 */
export function createNotification(input: CreateNotificationInput) {
  const validated = validateBody(createNotificationSchema, input);
  return insertNotification(validated as InsertNotificationInput);
}

/**
 * Create a notification for every admin user. Fire-and-forget.
 */
export function createNotificationsForAdmins(
  type: NotificationType,
  title: string,
  message: string,
  referenceId?: string | null,
  referenceType?: NotificationReferenceType | null,
  navigationPath?: string | null,
) {
  const adminRows = db.prepare(
    `SELECT id FROM users WHERE roles LIKE '%admin%'`
  ).all() as Array<{ id: string }>;

  for (const admin of adminRows) {
    insertNotification({
      userId: admin.id,
      type,
      title,
      message,
      referenceId: referenceId ?? null,
      referenceType: referenceType ?? null,
      navigationPath: navigationPath ?? null,
    });
  }
}

/**
 * Get paginated notifications for a user.
 */
export function getNotifications(userId: string, page: number = 1, limit: number = 20) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));

  const { notifications, total } = findByUserId(userId, safePage, safeLimit);
  const hasMore = safePage * safeLimit < total;

  return {
    notifications,
    total,
    page: safePage,
    limit: safeLimit,
    hasMore,
  };
}

/**
 * Get unread count for a user.
 */
export function getUnreadCount(userId: string) {
  return { unreadCount: countUnreadByUserId(userId) };
}

/**
 * Mark a single notification as read. Verifies ownership.
 */
export function markAsRead(notificationId: string, userId: string) {
  const updated = markReadById(notificationId, userId);
  if (!updated) {
    throw new ApiError(404, 'NOT_FOUND', 'Notification not found');
  }
}

/**
 * Mark all user's notifications as read.
 */
export function markAllAsRead(userId: string) {
  markAllReadByUserId(userId);
}
