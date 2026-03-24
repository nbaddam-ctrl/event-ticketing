import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { validateBody } from '../api/validation.js';
import { createBookingAtomically, getBookingWithDetails, cancelBookingAtomically } from '../repositories/bookingRepository.js';
import { getEventById, listEventTiers } from '../repositories/eventRepository.js';
import { ApiError } from '../api/errors.js';
import { incrementDiscountUsage, validateDiscountCode } from '../repositories/discountRepository.js';
import { createNotification } from './notificationService.js';
import { promoteWaitlistForTier } from './waitlistService.js';

const createBookingSchema = z.object({
  eventId: z.string().uuid(),
  ticketTierId: z.string().uuid(),
  quantity: z.number().int().min(1),
  discountCode: z.string().trim().optional()
});

export type CreateBookingRequest = z.infer<typeof createBookingSchema>;

export function parseCreateBookingRequest(payload: unknown): CreateBookingRequest {
  return validateBody(createBookingSchema, payload);
}

export function purchaseTickets(userId: string, payload: CreateBookingRequest) {
  if (payload.discountCode && (payload.discountCode.includes(',') || payload.discountCode.includes(' '))) {
    throw new ApiError(400, 'BAD_REQUEST', 'Only one discount code is allowed per booking');
  }

  const event = getEventById(payload.eventId);
  if (!event || event.status !== 'published') {
    throw new ApiError(404, 'NOT_FOUND', 'Event not found');
  }

  const tier = listEventTiers(payload.eventId).find((item) => item.id === payload.ticketTierId);
  if (!tier) {
    throw new ApiError(404, 'NOT_FOUND', 'Ticket tier not found');
  }

  const subtotalMinor = tier.priceMinor * payload.quantity;
  let discountCodeId: string | null = null;
  let discountAmountMinor = 0;

  if (payload.discountCode) {
    const discountResult = validateDiscountCode({
      code: payload.discountCode,
      eventId: payload.eventId,
      ticketTierId: payload.ticketTierId,
      quantity: payload.quantity,
      unitPriceMinor: tier.priceMinor
    });

    if (!discountResult.valid) {
      throw new ApiError(400, 'BAD_REQUEST', discountResult.reason ?? 'Invalid discount code');
    }

    discountCodeId = discountResult.discountCodeId ?? null;
    discountAmountMinor = discountResult.discountAmountMinor;
  }

  const totalPaidMinor = Math.max(0, subtotalMinor - discountAmountMinor);

  const booking = createBookingAtomically({
    id: randomUUID(),
    userId,
    eventId: payload.eventId,
    ticketTierId: payload.ticketTierId,
    quantity: payload.quantity,
    unitPriceMinor: tier.priceMinor,
    subtotalMinor,
    discountCodeId,
    discountAmountMinor,
    totalPaidMinor
  }) as { id: string } | undefined;

  if (discountCodeId) {
    incrementDiscountUsage(discountCodeId);
  }

  // Fire-and-forget: notify user of booking confirmation
  try {
    const totalFormatted = (totalPaidMinor / 100).toFixed(2);
    createNotification({
      userId,
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: `Your booking for ${event.title} — ${tier.name} (x${payload.quantity}) is confirmed. Total: $${totalFormatted}.`,
      referenceId: booking?.id ?? undefined,
      referenceType: 'booking',
      navigationPath: '/my-bookings',
    });
  } catch (error) {
    console.warn('[notification] Failed to create booking confirmation notification:', error);
  }

  return booking;
}

export function cancelBooking(userId: string, bookingId: string) {
  const booking = getBookingWithDetails(bookingId, userId);
  if (!booking) {
    throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
  }

  if (booking.status === 'cancelled' || booking.status === 'refunded') {
    throw new ApiError(409, 'CONFLICT', 'Booking is already cancelled or refunded');
  }

  if (booking.status !== 'confirmed') {
    throw new ApiError(400, 'BAD_REQUEST', 'Only confirmed bookings can be cancelled');
  }

  if (booking.eventStatus === 'cancelled') {
    throw new ApiError(400, 'BAD_REQUEST', 'Cannot cancel booking for a cancelled event');
  }

  const now = new Date().toISOString();
  if (booking.eventStartAt <= now) {
    throw new ApiError(400, 'BAD_REQUEST', 'Cannot cancel booking for an event that has already started');
  }

  const paymentReference = `booking-${bookingId}`;
  const { refundId } = cancelBookingAtomically(
    bookingId,
    booking.quantity,
    booking.ticketTierId,
    booking.totalPaidMinor,
    booking.discountCodeId,
    paymentReference
  );

  // Fire-and-forget: promote waitlist
  try {
    promoteWaitlistForTier(booking.eventId, booking.ticketTierId, booking.quantity);
  } catch (error) {
    console.warn('[waitlist] Failed to promote waitlist after booking cancellation:', error);
  }

  // Fire-and-forget: send notification
  try {
    const refundFormatted = (booking.totalPaidMinor / 100).toFixed(2);
    createNotification({
      userId,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking for ${booking.eventTitle} (${booking.tierName}, ${booking.quantity} ticket(s)) has been cancelled. A refund of $${refundFormatted} has been initiated.`,
      referenceId: bookingId,
      referenceType: 'booking',
      navigationPath: '/my-bookings',
    });
  } catch (error) {
    console.warn('[notification] Failed to create booking cancellation notification:', error);
  }

  return {
    bookingId,
    status: 'cancelled' as const,
    refundId,
    refundAmountMinor: booking.totalPaidMinor,
  };
}
