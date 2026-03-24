/**
 * Booking Cancellation Acceptance Tests (US4 — T024)
 *
 * Gherkin-style acceptance tests for:
 * - Successful cancel with refund
 * - Cancel triggers waitlist promotion
 * - Cancel already-cancelled booking (409)
 * - Cancel booking for started event (400)
 * - Cancel booking for cancelled event (400)
 * - Cancel another user's booking (404)
 */
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { initTestDb, clearAllTables, closeTestDb, db } from '../setup.js';
import { seedUser, seedOrganizer, seedEvent, seedTier, seedBooking, seedWaitlistEntry } from '../helpers/db.js';
import { authHeader } from '../helpers/auth.js';

const app = createApp();

beforeAll(() => initTestDb());
afterAll(() => closeTestDb());
beforeEach(() => clearAllTables());

describe('Feature: Booking Cancellation', () => {
  describe('Scenario: Successful booking cancellation', () => {
    it('Given a confirmed booking, When I cancel it, Then status=cancelled, refund created, notification sent', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id, { title: 'Tech Conference' });
      const tier = seedTier(event.id, { name: 'Standard', priceMinor: 7500, soldQuantity: 2, capacityLimit: 100 });
      const booking = seedBooking(user.id, event.id, tier.id, { quantity: 2, totalPaidMinor: 15000 });

      const res = await request(app)
        .post(`/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(user.id));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('cancelled');
      expect(res.body.refundAmountMinor).toBe(15000);

      // Tier sold decreased
      const t = db.prepare('SELECT sold_quantity FROM ticket_tiers WHERE id = ?').get(tier.id) as { sold_quantity: number };
      expect(t.sold_quantity).toBe(0);

      // Refund created
      const refund = db.prepare('SELECT status, amount_minor FROM refunds WHERE booking_id = ?').get(booking.id) as any;
      expect(refund.status).toBe('requested');
      expect(refund.amount_minor).toBe(15000);

      // Notification sent
      const notif = db.prepare("SELECT type FROM notifications WHERE user_id = ? AND type = 'booking_cancelled'").get(user.id);
      expect(notif).toBeDefined();
    });
  });

  describe('Scenario: Successful cancellation triggers waitlist promotion', () => {
    it('Given users on waitlist, When I cancel freeing tickets, Then first eligible entry is promoted', async () => {
      const user = seedUser();
      const waitlistUser = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { capacityLimit: 1, soldQuantity: 1 });
      const booking = seedBooking(user.id, event.id, tier.id, { quantity: 1, totalPaidMinor: 5000 });
      seedWaitlistEntry(event.id, tier.id, waitlistUser.id, { requestedQuantity: 1, position: 1 });

      await request(app)
        .post(`/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(user.id));

      // Waitlist entry promoted
      const entry = db.prepare("SELECT status FROM waitlist_entries WHERE user_id = ?").get(waitlistUser.id) as { status: string };
      expect(entry.status).toBe('notified');

      // Promotion notification sent
      const notif = db.prepare("SELECT type FROM notifications WHERE user_id = ? AND type = 'waitlist_promoted'").get(waitlistUser.id);
      expect(notif).toBeDefined();
    });
  });

  describe('Scenario: Cancel already-cancelled booking', () => {
    it('returns 409 "Booking is already cancelled or refunded"', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);
      const booking = seedBooking(user.id, event.id, tier.id, { status: 'cancelled', totalPaidMinor: 5000 });

      const res = await request(app)
        .post(`/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(user.id));

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already cancelled or refunded');
    });
  });

  describe('Scenario: Cancel booking for started event', () => {
    it('returns 400 "Cannot cancel booking for an event that has already started"', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const pastStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const futureEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const event = seedEvent(organizer.id, { startAt: pastStart, endAt: futureEnd });
      const tier = seedTier(event.id, { soldQuantity: 1 });
      const booking = seedBooking(user.id, event.id, tier.id, { totalPaidMinor: 5000 });

      const res = await request(app)
        .post(`/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(user.id));

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already started');
    });
  });

  describe('Scenario: Cancel booking for cancelled event', () => {
    it('returns 400 "Cannot cancel booking for a cancelled event"', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id, { status: 'cancelled' });
      const tier = seedTier(event.id);
      const booking = seedBooking(user.id, event.id, tier.id, { totalPaidMinor: 5000 });

      const res = await request(app)
        .post(`/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(user.id));

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cancelled event');
    });
  });

  describe('Scenario: Cancel another user\'s booking', () => {
    it('returns 404 "Booking not found" (not 403 for security)', async () => {
      const user1 = seedUser();
      const user2 = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { soldQuantity: 1 });
      const booking = seedBooking(user1.id, event.id, tier.id, { totalPaidMinor: 5000 });

      const res = await request(app)
        .post(`/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(user2.id));

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Booking not found');
    });
  });
});
