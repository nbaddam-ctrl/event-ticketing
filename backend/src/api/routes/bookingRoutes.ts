import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { parseCreateBookingRequest, purchaseTickets, cancelBooking } from '../../services/bookingService.js';
import { db } from '../../db/client.js';

export const bookingRoutes = Router();

bookingRoutes.get('/', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const rows = db.prepare(
      `SELECT
         b.id,
         b.event_id       AS eventId,
         b.ticket_tier_id  AS ticketTierId,
         b.quantity,
         b.unit_price_minor AS unitPriceMinor,
         b.subtotal_minor   AS subtotalMinor,
         b.discount_amount_minor AS discountAmountMinor,
         b.total_paid_minor AS totalPaidMinor,
         b.status,
         b.created_at       AS createdAt,
         e.title            AS eventTitle,
         e.venue_name       AS venueName,
         e.start_at         AS eventStartAt,
         t.name             AS tierName
       FROM bookings b
       JOIN events e ON e.id = b.event_id
       JOIN ticket_tiers t ON t.id = b.ticket_tier_id
       WHERE b.user_id = ?
       ORDER BY CASE b.status
         WHEN 'confirmed' THEN 1
         WHEN 'pending' THEN 2
         WHEN 'cancelled' THEN 3
         WHEN 'refunded' THEN 4
         ELSE 5
       END, b.created_at DESC`
    ).all(req.auth!.sub);

    res.json({ items: rows });
  } catch (error) {
    next(error);
  }
});

bookingRoutes.post('/', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = parseCreateBookingRequest(req.body);
    const booking = purchaseTickets(req.auth!.sub, payload);
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

bookingRoutes.post('/:id/cancel', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = cancelBooking(req.auth!.sub, bookingId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
