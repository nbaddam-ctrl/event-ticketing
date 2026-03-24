/**
 * Waitlist Management Acceptance Tests (US4 — T025)
 *
 * Gherkin-style acceptance tests for:
 * - Join waitlist for sold-out tier
 * - Promotion on cancellation
 * - Skip entry needing more tickets than available
 * - Reservation expiry
 */
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { initTestDb, clearAllTables, closeTestDb, db } from '../setup.js';
import { seedUser, seedOrganizer, seedEvent, seedTier, seedBooking, seedWaitlistEntry } from '../helpers/db.js';
import { authHeader } from '../helpers/auth.js';
import { expireWaitlistHold } from '../../src/repositories/waitlistRepository.js';

const app = createApp();

beforeAll(() => initTestDb());
afterAll(() => closeTestDb());
beforeEach(() => clearAllTables());

describe('Feature: Waitlist Management', () => {
  describe('Scenario: Join waitlist for sold-out tier', () => {
    it('Given a sold-out tier, When I join the waitlist, Then entry is created with status queued', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id, { title: 'Concert' });
      const tier = seedTier(event.id, { name: 'Floor', capacityLimit: 100, soldQuantity: 100 });

      const res = await request(app)
        .post('/waitlist')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, requestedQuantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('queued');
      expect(res.body.position).toBe(1);
    });
  });

  describe('Scenario: Waitlist promotion on ticket cancellation', () => {
    it('Given I am queued at position 1 requesting 1 ticket, When a ticket becomes available, Then I am promoted', async () => {
      const user = seedUser();
      const waitlistUser = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { capacityLimit: 1, soldQuantity: 1 });
      const booking = seedBooking(user.id, event.id, tier.id, { quantity: 1, totalPaidMinor: 5000 });
      seedWaitlistEntry(event.id, tier.id, waitlistUser.id, { requestedQuantity: 1, position: 1 });

      // Cancel the booking to free a ticket
      await request(app)
        .post(`/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(user.id));

      const entry = db.prepare('SELECT status, reservation_expires_at FROM waitlist_entries WHERE user_id = ?').get(waitlistUser.id) as {
        status: string;
        reservation_expires_at: string | null;
      };
      expect(entry.status).toBe('notified');
      expect(entry.reservation_expires_at).not.toBeNull();
    });
  });

  describe('Scenario: Waitlist promotion skips entry needing more tickets than available', () => {
    it('Given UserA wants 3 tickets and UserB wants 1, When 1 ticket becomes available, Then UserA is skipped and UserB is promoted', async () => {
      const booker = seedUser();
      const userA = seedUser();
      const userB = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { capacityLimit: 1, soldQuantity: 1 });
      const booking = seedBooking(booker.id, event.id, tier.id, { quantity: 1, totalPaidMinor: 5000 });

      seedWaitlistEntry(event.id, tier.id, userA.id, { requestedQuantity: 3, position: 1 });
      seedWaitlistEntry(event.id, tier.id, userB.id, { requestedQuantity: 1, position: 2 });

      // Cancel to free 1 ticket
      await request(app)
        .post(`/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(booker.id));

      const entryA = db.prepare('SELECT status FROM waitlist_entries WHERE user_id = ?').get(userA.id) as { status: string };
      const entryB = db.prepare('SELECT status FROM waitlist_entries WHERE user_id = ?').get(userB.id) as { status: string };

      expect(entryA.status).toBe('queued'); // Skipped
      expect(entryB.status).toBe('notified'); // Promoted
    });
  });

  describe('Scenario: Waitlist reservation expires', () => {
    it('Given my entry was promoted, When the 30-min reservation expires, Then status changes to expired', () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);
      const entry = seedWaitlistEntry(event.id, tier.id, user.id, {
        status: 'notified',
        requestedQuantity: 1,
        position: 1,
        notifiedAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
        reservationExpiresAt: new Date(Date.now() - 1000).toISOString(),
      });

      expireWaitlistHold(entry.id);

      const row = db.prepare('SELECT status FROM waitlist_entries WHERE id = ?').get(entry.id) as { status: string };
      expect(row.status).toBe('expired');
    });
  });
});
