import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ApiError } from '../api/errors.js';
import { validateBody } from '../api/validation.js';
import { db, withTransaction } from '../db/client.js';
import { isApprovedOrganizerOrAdmin } from '../repositories/organizerRepository.js';
import { createRefundRequest } from '../repositories/refundRepository.js';
import { listOrganizerEvents, countOrganizerEvents, getEventById, syncEventTiers, listEventTiers, addTierToEvent, updateTier, deactivateTier, type AddTierInput } from '../repositories/eventRepository.js';
import { createNotification } from './notificationService.js';

const ticketTierSchema = z.object({
  name: z.string().min(1),
  priceMinor: z.number().int().min(0),
  currency: z.string().min(3).max(3),
  capacityLimit: z.number().int().min(1)
});

const updateTiersSchema = z.object({
  tiers: z.array(ticketTierSchema).min(1)
});

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  venueName: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().min(1),
  tiers: z.array(ticketTierSchema).min(1)
});

export type CreateEventRequest = z.infer<typeof createEventSchema>;

export function parseCreateEventRequest(payload: unknown): CreateEventRequest {
  return validateBody(createEventSchema, payload);
}

export function createOrganizerEvent(userId: string, payload: CreateEventRequest) {
  if (!isApprovedOrganizerOrAdmin(userId)) {
    throw new ApiError(403, 'FORBIDDEN', 'Organizer approval required');
  }

  const now = new Date().toISOString();
  const eventId = randomUUID();

  withTransaction(() => {
    db.prepare(
      `INSERT INTO events (
        id, organizer_id, title, description, venue_name,
        start_at, end_at, timezone, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`
    ).run(
      eventId,
      userId,
      payload.title,
      payload.description ?? null,
      payload.venueName,
      payload.startAt,
      payload.endAt,
      payload.timezone,
      now,
      now
    );

    for (const tier of payload.tiers) {
      db.prepare(
        `INSERT INTO ticket_tiers (
          id, event_id, name, price_minor, currency, capacity_limit,
          sold_quantity, reserved_quantity, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'active', ?, ?)`
      ).run(randomUUID(), eventId, tier.name, tier.priceMinor, tier.currency, tier.capacityLimit, now, now);
    }
  });

  return {
    id: eventId,
    title: payload.title,
    venueName: payload.venueName,
    startAt: payload.startAt,
    endAt: payload.endAt,
    timezone: payload.timezone,
    status: 'published'
  };
}

export function cancelOrganizerEvent(userId: string, eventId: string, reason?: string) {
  const event = db
    .prepare('SELECT id, organizer_id as organizerId, status FROM events WHERE id = ?')
    .get(eventId) as { id: string; organizerId: string; status: string } | undefined;

  if (!event) {
    throw new ApiError(404, 'NOT_FOUND', 'Event not found');
  }

  const user = db
    .prepare('SELECT roles FROM users WHERE id = ?')
    .get(userId) as { roles: string } | undefined;
  const isAdmin = user?.roles.split(',').map((item) => item.trim()).includes('admin') ?? false;

  if (event.organizerId !== userId && !isAdmin) {
    throw new ApiError(403, 'FORBIDDEN', 'Only the organizer or admin can cancel this event');
  }

  if (event.status === 'cancelled') {
    return { eventId, status: 'cancelled', refundCount: 0 };
  }

  // Get event title for notification messages
  const eventDetails = db
    .prepare('SELECT title FROM events WHERE id = ?')
    .get(eventId) as { title: string } | undefined;

  const { refundCount, affectedUsers } = withTransaction(() => {
    db.prepare(
      `UPDATE events
       SET status = 'cancelled', cancellation_reason = ?, updated_at = ?
       WHERE id = ?`
    ).run(reason ?? null, new Date().toISOString(), eventId);

    db.prepare(
      `UPDATE bookings
       SET status = 'cancelled', updated_at = ?
       WHERE event_id = ? AND status = 'confirmed'`
    ).run(new Date().toISOString(), eventId);

    const affectedBookings = db
      .prepare(
        `SELECT id, user_id as affectedUserId, total_paid_minor as totalPaidMinor
         FROM bookings
         WHERE event_id = ?`
      )
      .all(eventId) as Array<{ id: string; affectedUserId: string; totalPaidMinor: number }>;

    let count = 0;
    const users: Array<{ userId: string; refundAmount: number }> = [];
    for (const booking of affectedBookings) {
      createRefundRequest({
        bookingId: booking.id,
        paymentReference: `booking-${booking.id}`,
        amountMinor: booking.totalPaidMinor
      });
      users.push({ userId: booking.affectedUserId, refundAmount: booking.totalPaidMinor });
      count += 1;
    }

    return { refundCount: count, affectedUsers: users };
  });

  // Fire-and-forget: notify each affected attendee
  try {
    const eventTitle = eventDetails?.title ?? 'An event';
    const reasonText = reason ? ` Reason: ${reason}` : '';
    for (const { userId: attendeeUserId, refundAmount } of affectedUsers) {
      try {
        const refundFormatted = (refundAmount / 100).toFixed(2);
        createNotification({
          userId: attendeeUserId,
          type: 'event_cancelled',
          title: 'Event Cancelled',
          message: `${eventTitle} has been cancelled.${reasonText} A refund of $${refundFormatted} has been initiated.`,
          referenceId: eventId,
          referenceType: 'event',
          navigationPath: `/events/${eventId}`,
        });
      } catch (innerError) {
        console.warn('[notification] Failed to notify attendee of cancellation:', innerError);
      }
    }
  } catch (error) {
    console.warn('[notification] Failed to create event cancellation notifications:', error);
  }

  return {
    eventId,
    status: 'cancelled',
    refundCount
  };
}

export function listOrganizerEventsForUser(userId: string, page: number, pageSize: number) {
  if (!isApprovedOrganizerOrAdmin(userId)) {
    throw new ApiError(403, 'FORBIDDEN', 'Organizer approval required');
  }

  const items = listOrganizerEvents(userId, page, pageSize);
  const total = countOrganizerEvents(userId);
  return { items, total, page, pageSize };
}

export function parseUpdateTiersRequest(payload: unknown) {
  return validateBody(updateTiersSchema, payload);
}

function assertEventOwnership(userId: string, eventId: string) {
  const event = getEventById(eventId);
  if (!event) {
    throw new ApiError(404, 'NOT_FOUND', 'Event not found');
  }

  const user = db
    .prepare('SELECT roles FROM users WHERE id = ?')
    .get(userId) as { roles: string } | undefined;
  const isAdmin = user?.roles.split(',').map((item) => item.trim()).includes('admin') ?? false;

  if (event.organizerId !== userId && !isAdmin) {
    throw new ApiError(403, 'FORBIDDEN', 'Only the organizer or admin can modify this event');
  }

  if (event.status === 'cancelled') {
    throw new ApiError(400, 'BAD_REQUEST', 'Cannot modify tiers for a cancelled event');
  }

  return event;
}

export function updateEventTiers(userId: string, eventId: string, payload: { tiers: AddTierInput[] }) {
  assertEventOwnership(userId, eventId);
  const updatedTiers = syncEventTiers(eventId, payload.tiers);
  return {
    eventId,
    tiers: updatedTiers.map((t) => ({
      ...t,
      remainingQuantity: t.capacityLimit - t.soldQuantity - t.reservedQuantity,
    })),
  };
}

export function addTierToExistingEvent(userId: string, eventId: string, tier: AddTierInput) {
  assertEventOwnership(userId, eventId);

  // Check name uniqueness among active tiers
  const existing = listEventTiers(eventId);
  if (existing.some((t) => t.name.toLowerCase() === tier.name.toLowerCase())) {
    throw new ApiError(409, 'CONFLICT', `A tier named "${tier.name}" already exists for this event`);
  }

  const newTier = addTierToEvent(eventId, tier);
  return {
    ...newTier,
    remainingQuantity: newTier.capacityLimit - newTier.soldQuantity - newTier.reservedQuantity,
  };
}

export function updateExistingTier(userId: string, eventId: string, tierId: string, updates: { name?: string; priceMinor?: number; currency?: string; capacityLimit?: number }) {
  assertEventOwnership(userId, eventId);

  const tiers = listEventTiers(eventId);
  const tier = tiers.find((t) => t.id === tierId);
  if (!tier) {
    throw new ApiError(404, 'NOT_FOUND', 'Ticket tier not found');
  }

  // Check capacity is not below sold + reserved
  if (updates.capacityLimit !== undefined && updates.capacityLimit < tier.soldQuantity + tier.reservedQuantity) {
    throw new ApiError(400, 'BAD_REQUEST', `Capacity cannot be less than ${tier.soldQuantity + tier.reservedQuantity} (already sold/reserved)`);
  }

  // Check name uniqueness if name is changing
  if (updates.name !== undefined && updates.name.toLowerCase() !== tier.name.toLowerCase()) {
    if (tiers.some((t) => t.id !== tierId && t.name.toLowerCase() === updates.name!.toLowerCase())) {
      throw new ApiError(409, 'CONFLICT', `A tier named "${updates.name}" already exists for this event`);
    }
  }

  updateTier(tierId, updates);
  const updated = listEventTiers(eventId).find((t) => t.id === tierId)!;
  return {
    ...updated,
    remainingQuantity: updated.capacityLimit - updated.soldQuantity - updated.reservedQuantity,
  };
}

export function deactivateExistingTier(userId: string, eventId: string, tierId: string) {
  assertEventOwnership(userId, eventId);

  const tiers = listEventTiers(eventId);
  const tier = tiers.find((t) => t.id === tierId);
  if (!tier) {
    throw new ApiError(404, 'NOT_FOUND', 'Ticket tier not found');
  }

  if (tier.soldQuantity > 0 || tier.reservedQuantity > 0) {
    throw new ApiError(400, 'BAD_REQUEST', 'Cannot deactivate a tier with existing bookings or reservations');
  }

  if (tiers.length <= 1) {
    throw new ApiError(400, 'BAD_REQUEST', 'Cannot deactivate the last remaining tier');
  }

  deactivateTier(tierId);
  return { tierId, status: 'inactive' };
}

export function getOrganizerEventDetails(userId: string, eventId: string) {
  const event = assertEventOwnership(userId, eventId);

  const tiers = listEventTiers(eventId).map((t) => ({
    ...t,
    remainingQuantity: t.capacityLimit - t.soldQuantity - t.reservedQuantity,
  }));

  return { ...event, tiers };
}
