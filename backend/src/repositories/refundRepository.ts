import { randomUUID } from 'node:crypto';
import { db } from '../db/client.js';

export interface RefundInput {
  bookingId: string;
  paymentReference: string;
  amountMinor: number;
}

export function createRefundRequest(input: RefundInput, reason: string = 'event_cancelled') {
  const now = new Date().toISOString();
  const id = randomUUID();

  db.prepare(
    `INSERT INTO refunds (
      id, booking_id, payment_reference, amount_minor, method, status, reason,
      requested_at, updated_at
    ) VALUES (?, ?, ?, ?, 'original_payment_method', 'requested', ?, ?, ?)`
  ).run(id, input.bookingId, input.paymentReference, input.amountMinor, reason, now, now);

  return { id, status: 'requested' };
}

export function listBookingRefunds(bookingId: string) {
  return db
    .prepare(
      `SELECT id, booking_id as bookingId, amount_minor as amountMinor, status, requested_at as requestedAt
       FROM refunds
       WHERE booking_id = ?
       ORDER BY requested_at DESC`
    )
    .all(bookingId) as Array<{
    id: string;
    bookingId: string;
    amountMinor: number;
    status: string;
    requestedAt: string;
  }>;
}
