import { randomUUID } from 'node:crypto';
import { db } from '../db/client.js';

export function createWaitlistEntry(input: {
  eventId: string;
  ticketTierId: string;
  userId: string;
  requestedQuantity: number;
}) {
  const now = new Date().toISOString();
  const id = randomUUID();

  const row = db
    .prepare(
      `SELECT COALESCE(MAX(position), 0) + 1 as nextPosition
       FROM waitlist_entries
       WHERE event_id = ? AND ticket_tier_id = ?`
    )
    .get(input.eventId, input.ticketTierId) as { nextPosition: number };

  db.prepare(
    `INSERT INTO waitlist_entries (
      id, event_id, ticket_tier_id, user_id, requested_quantity,
      position, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?)`
  ).run(
    id,
    input.eventId,
    input.ticketTierId,
    input.userId,
    input.requestedQuantity,
    row.nextPosition,
    now,
    now
  );

  return { id, status: 'queued', position: row.nextPosition };
}

export function listQueuedWaitlistEntries(eventId: string, ticketTierId: string) {
  return db
    .prepare(
      `SELECT
         id,
         user_id as userId,
         requested_quantity as requestedQuantity,
         position,
         created_at as createdAt
       FROM waitlist_entries
       WHERE event_id = ? AND ticket_tier_id = ? AND status = 'queued'
       ORDER BY position ASC, created_at ASC`
    )
    .all(eventId, ticketTierId) as Array<{
    id: string;
    userId: string;
    requestedQuantity: number;
    position: number;
    createdAt: string;
  }>;
}

export function markWaitlistEntryNotified(entryId: string, expiresAt: string) {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE waitlist_entries
     SET status = 'notified', notified_at = ?, reservation_expires_at = ?, updated_at = ?
     WHERE id = ?`
  ).run(now, expiresAt, now, entryId);
}

export function expireWaitlistHold(entryId: string) {
  db.prepare(
    `UPDATE waitlist_entries
     SET status = 'expired', updated_at = ?
     WHERE id = ? AND status = 'notified'`
  ).run(new Date().toISOString(), entryId);
}
