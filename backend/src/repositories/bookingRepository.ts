import { db, withTransaction } from '../db/client.js';
import { ApiError } from '../api/errors.js';
import { createRefundRequest } from './refundRepository.js';
import { decrementDiscountUsage } from './discountRepository.js';

export interface CreateBookingInput {
  id: string;
  userId: string;
  eventId: string;
  ticketTierId: string;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
  discountCodeId: string | null;
  discountAmountMinor: number;
  totalPaidMinor: number;
}

export interface BookingWithDetails {
  id: string;
  userId: string;
  eventId: string;
  ticketTierId: string;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
  discountCodeId: string | null;
  discountAmountMinor: number;
  totalPaidMinor: number;
  status: string;
  createdAt: string;
  eventTitle: string;
  eventStartAt: string;
  eventStatus: string;
  tierName: string;
}

export function getBookingWithDetails(bookingId: string, userId: string): BookingWithDetails | undefined {
  return db.prepare(`
    SELECT
      b.id,
      b.user_id as userId,
      b.event_id as eventId,
      b.ticket_tier_id as ticketTierId,
      b.quantity,
      b.unit_price_minor as unitPriceMinor,
      b.subtotal_minor as subtotalMinor,
      b.discount_code_id as discountCodeId,
      b.discount_amount_minor as discountAmountMinor,
      b.total_paid_minor as totalPaidMinor,
      b.status,
      b.created_at as createdAt,
      e.title as eventTitle,
      e.start_at as eventStartAt,
      e.status as eventStatus,
      t.name as tierName
    FROM bookings b
    JOIN events e ON e.id = b.event_id
    JOIN ticket_tiers t ON t.id = b.ticket_tier_id
    WHERE b.id = ? AND b.user_id = ?
  `).get(bookingId, userId) as BookingWithDetails | undefined;
}

export interface CancelBookingResult {
  refundId: string;
}

export function cancelBookingAtomically(
  bookingId: string,
  quantity: number,
  ticketTierId: string,
  totalPaidMinor: number,
  discountCodeId: string | null,
  paymentReference: string
): CancelBookingResult {
  return withTransaction(() => {
    const now = new Date().toISOString();

    // 1. Update booking status
    db.prepare(
      `UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ?`
    ).run(now, bookingId);

    // 2. Restore tier inventory
    db.prepare(
      `UPDATE ticket_tiers SET sold_quantity = sold_quantity - ?, updated_at = ? WHERE id = ?`
    ).run(quantity, now, ticketTierId);

    // 3. Create refund with reason 'user_cancelled'
    const refund = createRefundRequest(
      { bookingId, paymentReference, amountMinor: totalPaidMinor },
      'user_cancelled'
    );

    // 4. Decrement discount usage if applicable
    if (discountCodeId) {
      decrementDiscountUsage(discountCodeId);
    }

    return { refundId: refund.id };
  });
}

export function createBookingAtomically(input: CreateBookingInput) {
  return withTransaction(() => {
    const tier = db
      .prepare(
        `SELECT capacity_limit as capacityLimit, sold_quantity as soldQuantity, reserved_quantity as reservedQuantity
         FROM ticket_tiers WHERE id = ?`
      )
      .get(input.ticketTierId) as
      | { capacityLimit: number; soldQuantity: number; reservedQuantity: number }
      | undefined;

    if (!tier) {
      throw new ApiError(404, 'NOT_FOUND', 'Ticket tier not found');
    }

    const remaining = tier.capacityLimit - tier.soldQuantity - tier.reservedQuantity;
    if (remaining < input.quantity) {
      throw new ApiError(409, 'CONFLICT', 'Insufficient inventory for requested quantity');
    }

    db.prepare(
      `UPDATE ticket_tiers
       SET sold_quantity = sold_quantity + ?, updated_at = ?
       WHERE id = ?`
    ).run(input.quantity, new Date().toISOString(), input.ticketTierId);

    db.prepare(
      `INSERT INTO bookings (
        id, user_id, event_id, ticket_tier_id, quantity, unit_price_minor,
        subtotal_minor, discount_code_id, discount_amount_minor,
        total_paid_minor, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`
    ).run(
      input.id,
      input.userId,
      input.eventId,
      input.ticketTierId,
      input.quantity,
      input.unitPriceMinor,
      input.subtotalMinor,
      input.discountCodeId,
      input.discountAmountMinor,
      input.totalPaidMinor,
      new Date().toISOString(),
      new Date().toISOString()
    );

    return db.prepare('SELECT * FROM bookings WHERE id = ?').get(input.id);
  });
}
