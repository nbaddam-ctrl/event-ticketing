import { randomUUID } from 'node:crypto';
import { db } from '../db/client.js';
import type { NotificationType, NotificationReferenceType } from '../domain/types.js';

export interface InsertNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string | null;
  referenceType?: NotificationReferenceType | null;
  navigationPath?: string | null;
}

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: number;
  reference_id: string | null;
  reference_type: string | null;
  navigation_path: string | null;
  created_at: string;
  read_at: string | null;
}

function mapRow(row: NotificationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    isRead: row.is_read === 1,
    referenceId: row.reference_id,
    referenceType: row.reference_type as NotificationReferenceType | null,
    navigationPath: row.navigation_path,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

export function insertNotification(input: InsertNotificationInput) {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, is_read, reference_id, reference_type, navigation_path, created_at, read_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, NULL)`
  ).run(
    id,
    input.userId,
    input.type,
    input.title,
    input.message,
    input.referenceId ?? null,
    input.referenceType ?? null,
    input.navigationPath ?? null,
    now,
  );

  return { id, createdAt: now };
}

export function findByUserId(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const rows = db.prepare(
    `SELECT id, user_id, type, title, message, is_read, reference_id, reference_type, navigation_path, created_at, read_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`
  ).all(userId, limit, offset) as NotificationRow[];

  const countResult = db.prepare(
    `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`
  ).get(userId) as { total: number };

  return {
    notifications: rows.map(mapRow),
    total: countResult.total,
  };
}

export function countUnreadByUserId(userId: string): number {
  const result = db.prepare(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`
  ).get(userId) as { count: number };

  return result.count;
}

export function markReadById(notificationId: string, userId: string): boolean {
  const now = new Date().toISOString();
  const result = db.prepare(
    `UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ? AND user_id = ?`
  ).run(now, notificationId, userId);

  return result.changes > 0;
}

export function markAllReadByUserId(userId: string): number {
  const now = new Date().toISOString();
  const result = db.prepare(
    `UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0`
  ).run(now, userId);

  return result.changes;
}
