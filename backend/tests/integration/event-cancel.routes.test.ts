/**
 * Event Cancellation Acceptance Tests (US4 — T027)
 *
 * Gherkin-style acceptance tests for:
 * - Cancel event with bookings (creates refunds + notifications)
 * - Cancel already-cancelled event (no-op)
 * - Non-owner attempts to cancel (403)
 * - Admin can cancel any event
 */
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { initTestDb, clearAllTables, closeTestDb, db } from '../setup.js';
import { seedUser, seedOrganizer, seedAdmin, seedEvent, seedTier, seedBooking } from '../helpers/db.js';
import { authHeader } from '../helpers/auth.js';

const app = createApp();

beforeAll(() => initTestDb());
afterAll(() => closeTestDb());
beforeEach(() => clearAllTables());

describe('Feature: Event Cancellation', () => {
  describe('Scenario: Cancel event with bookings', () => {
    it('Given 5 confirmed bookings, When organizer cancels, Then all bookings cancelled + refunds + notifications', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id, { title: 'Workshop' });
      const tier = seedTier(event.id, { soldQuantity: 5, priceMinor: 7500 });

      // Create 5 bookings
      const attendees: string[] = [];
      for (let i = 0; i < 5; i++) {
        const user = seedUser();
        attendees.push(user.id);
        seedBooking(user.id, event.id, tier.id, { quantity: 1, totalPaidMinor: 7500 });
      }

      const res = await request(app)
        .post(`/events/${event.id}/cancel`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']))
        .send({ reason: 'Venue unavailable' });

      expect(res.status).toBe(202);
      expect(res.body.status).toBe('cancelled');
      expect(res.body.refundCount).toBe(5);

      // Event is cancelled
      const eventRow = db.prepare('SELECT status FROM events WHERE id = ?').get(event.id) as { status: string };
      expect(eventRow.status).toBe('cancelled');

      // All bookings cancelled
      const bookings = db.prepare("SELECT status FROM bookings WHERE event_id = ?").all(event.id) as Array<{ status: string }>;
      expect(bookings.every((b) => b.status === 'cancelled')).toBe(true);

      // 5 refunds created
      const refunds = db.prepare('SELECT status FROM refunds').all() as Array<{ status: string }>;
      expect(refunds.length).toBe(5);
      expect(refunds.every((r) => r.status === 'requested')).toBe(true);

      // Notifications sent to each attendee
      const notifications = db
        .prepare("SELECT user_id FROM notifications WHERE type = 'event_cancelled'")
        .all() as Array<{ user_id: string }>;
      expect(notifications.length).toBe(5);
      const notifiedUserIds = notifications.map((n) => n.user_id).sort();
      expect(notifiedUserIds).toEqual(attendees.sort());
    });
  });

  describe('Scenario: Cancel already-cancelled event', () => {
    it('returns 202 with refundCount 0 and status cancelled', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id, { status: 'cancelled' });

      const res = await request(app)
        .post(`/events/${event.id}/cancel`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']));

      expect(res.status).toBe(202);
      expect(res.body.refundCount).toBe(0);
      expect(res.body.status).toBe('cancelled');
    });
  });

  describe('Scenario: Non-owner attempts to cancel event', () => {
    it('returns 403 "Only the organizer or admin can cancel this event"', async () => {
      const organizer = seedOrganizer();
      const otherOrganizer = seedOrganizer();
      const event = seedEvent(organizer.id);

      const res = await request(app)
        .post(`/events/${event.id}/cancel`)
        .set('Authorization', authHeader(otherOrganizer.id, ['attendee', 'organizer']));

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only the organizer or admin');
    });
  });

  describe('Scenario: Admin cancels any event', () => {
    it('admin can cancel event they do not own', async () => {
      const admin = seedAdmin();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { soldQuantity: 1 });
      seedBooking(seedUser().id, event.id, tier.id, { totalPaidMinor: 5000 });

      const res = await request(app)
        .post(`/events/${event.id}/cancel`)
        .set('Authorization', authHeader(admin.id, ['admin']))
        .send({ reason: 'Admin override' });

      expect(res.status).toBe(202);
      expect(res.body.status).toBe('cancelled');
      expect(res.body.refundCount).toBe(1);
    });
  });
});
