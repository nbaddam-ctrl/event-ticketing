import { z } from 'zod';
import { ApiError } from '../api/errors.js';
import { validateBody } from '../api/validation.js';
import {
  createWaitlistEntry,
  listQueuedWaitlistEntries,
  markWaitlistEntryNotified
} from '../repositories/waitlistRepository.js';
import { db } from '../db/client.js';
import { createNotification } from './notificationService.js';

const joinWaitlistSchema = z.object({
  eventId: z.string().uuid(),
  ticketTierId: z.string().uuid(),
  requestedQuantity: z.number().int().min(1)
});

export type JoinWaitlistRequest = z.infer<typeof joinWaitlistSchema>;

export function parseJoinWaitlistRequest(payload: unknown): JoinWaitlistRequest {
  return validateBody(joinWaitlistSchema, payload);
}

export function joinWaitlist(userId: string, payload: JoinWaitlistRequest) {
  if (!userId) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  return createWaitlistEntry({
    eventId: payload.eventId,
    ticketTierId: payload.ticketTierId,
    userId,
    requestedQuantity: payload.requestedQuantity
  });
}

export function promoteWaitlistForTier(eventId: string, ticketTierId: string, availableQuantity: number) {
  const queue = listQueuedWaitlistEntries(eventId, ticketTierId);
  const promoted: Array<{ entryId: string; expiresAt: string }> = [];
  let remaining = availableQuantity;

  // Fetch event and tier names for notification messages
  const eventRow = db.prepare('SELECT title FROM events WHERE id = ?').get(eventId) as { title: string } | undefined;
  const tierRow = db.prepare('SELECT name FROM ticket_tiers WHERE id = ?').get(ticketTierId) as { name: string } | undefined;

  for (const entry of queue) {
    if (remaining < entry.requestedQuantity) {
      continue;
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    markWaitlistEntryNotified(entry.id, expiresAt);
    promoted.push({ entryId: entry.id, expiresAt });
    remaining -= entry.requestedQuantity;

    // Fire-and-forget: notify promoted user
    try {
      const eventTitle = eventRow?.title ?? 'An event';
      const tierName = tierRow?.name ?? 'a ticket tier';
      const expiryTime = new Date(expiresAt).toLocaleTimeString();
      createNotification({
        userId: entry.userId,
        type: 'waitlist_promoted',
        title: 'Tickets Available',
        message: `Great news! ${entry.requestedQuantity} ticket(s) for ${eventTitle} — ${tierName} are now available for you. Reserve by ${expiryTime}.`,
        referenceId: entry.id,
        referenceType: 'waitlist_entry',
        navigationPath: `/events/${eventId}`,
      });
    } catch (error) {
      console.warn('[notification] Failed to create waitlist promotion notification:', error);
    }

    if (remaining <= 0) {
      break;
    }
  }

  return promoted;
}

/**
 * Send a waitlist_expired notification when a reservation expires.
 * Called by the expiry detection logic.
 */
export function notifyWaitlistExpired(entryId: string, userId: string, eventId: string, ticketTierId: string) {
  try {
    const eventRow = db.prepare('SELECT title FROM events WHERE id = ?').get(eventId) as { title: string } | undefined;
    const tierRow = db.prepare('SELECT name FROM ticket_tiers WHERE id = ?').get(ticketTierId) as { name: string } | undefined;
    const eventTitle = eventRow?.title ?? 'An event';
    const tierName = tierRow?.name ?? 'a ticket tier';

    createNotification({
      userId,
      type: 'waitlist_expired',
      title: 'Reservation Expired',
      message: `Your waitlist reservation for ${eventTitle} — ${tierName} has expired. The tickets have been released.`,
      referenceId: entryId,
      referenceType: 'waitlist_entry',
      navigationPath: `/events/${eventId}`,
    });
  } catch (error) {
    console.warn('[notification] Failed to create waitlist expiry notification:', error);
  }
}
