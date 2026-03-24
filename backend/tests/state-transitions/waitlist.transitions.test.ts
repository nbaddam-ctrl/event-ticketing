/**
 * Waitlist Entry State Transition Tests (US1 — T011)
 *
 * Validates waitlist entry lifecycle:
 * - (new) → queued via joinWaitlist()
 * - queued → notified via promoteWaitlistForTier()
 * - notified → expired via expireWaitlistHold()
 * - INVALID: skip promotion when requestedQuantity exceeds available
 */
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { initTestDb, clearAllTables, closeTestDb, db } from '../setup.js';
import { seedUser, seedOrganizer, seedEvent, seedTier, seedBooking, seedWaitlistEntry } from '../helpers/db.js';
import { authHeader } from '../helpers/auth.js';
import { promoteWaitlistForTier } from '../../src/services/waitlistService.js';
import { expireWaitlistHold } from '../../src/repositories/waitlistRepository.js';

const app = createApp();

beforeAll(() => initTestDb());
afterAll(() => closeTestDb());
beforeEach(() => clearAllTables());

describe('Waitlist Entry State Transitions', () => {
  // ─── (new) → queued ────────────────────────────────

  describe('(new) → queued', () => {
    it('creates waitlist entry with queued status via POST /waitlist', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { capacityLimit: 10, soldQuantity: 10 });

      const res = await request(app)
        .post('/waitlist')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, requestedQuantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('queued');
      expect(res.body.position).toBe(1);
    });

    it('assigns sequential positions for multiple entries', async () => {
      const user1 = seedUser();
      const user2 = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { capacityLimit: 5, soldQuantity: 5 });

      const res1 = await request(app)
        .post('/waitlist')
        .set('Authorization', authHeader(user1.id))
        .send({ eventId: event.id, ticketTierId: tier.id, requestedQuantity: 1 });

      const res2 = await request(app)
        .post('/waitlist')
        .set('Authorization', authHeader(user2.id))
        .send({ eventId: event.id, ticketTierId: tier.id, requestedQuantity: 1 });

      expect(res1.body.position).toBe(1);
      expect(res2.body.position).toBe(2);
    });
  });

  // ─── queued → notified (promotion) ─────────────────

  describe('queued → notified', () => {
    it('promotes queued entry to notified when tickets become available', () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { capacityLimit: 10, soldQuantity: 9 });
      const entry = seedWaitlistEntry(event.id, tier.id, user.id, {
        requestedQuantity: 1,
        position: 1,
      });

      const promoted = promoteWaitlistForTier(event.id, tier.id, 1);
      expect(promoted.length).toBe(1);
      expect(promoted[0].entryId).toBe(entry.id);

      const row = db.prepare('SELECT status FROM waitlist_entries WHERE id = ?').get(entry.id) as { status: string };
      expect(row.status).toBe('notified');
    });

    it('sets reservation_expires_at on promoted entry', () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);
      const entry = seedWaitlistEntry(event.id, tier.id, user.id, {
        requestedQuantity: 1,
        position: 1,
      });

      promoteWaitlistForTier(event.id, tier.id, 1);

      const row = db.prepare('SELECT reservation_expires_at FROM waitlist_entries WHERE id = ?').get(entry.id) as { reservation_expires_at: string | null };
      expect(row.reservation_expires_at).not.toBeNull();
    });

    it('sends waitlist_promoted notification to promoted user', () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);
      seedWaitlistEntry(event.id, tier.id, user.id, { requestedQuantity: 1, position: 1 });

      promoteWaitlistForTier(event.id, tier.id, 1);

      const notification = db.prepare(
        "SELECT type FROM notifications WHERE user_id = ? AND type = 'waitlist_promoted'"
      ).get(user.id) as { type: string } | undefined;
      expect(notification).toBeDefined();
    });
  });

  // ─── notified → expired ────────────────────────────

  describe('notified → expired', () => {
    it('transitions notified entry to expired via expireWaitlistHold()', () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);
      const entry = seedWaitlistEntry(event.id, tier.id, user.id, {
        status: 'notified',
        requestedQuantity: 1,
        position: 1,
        notifiedAt: new Date().toISOString(),
        reservationExpiresAt: new Date(Date.now() - 1000).toISOString(), // expired
      });

      expireWaitlistHold(entry.id);

      const row = db.prepare('SELECT status FROM waitlist_entries WHERE id = ?').get(entry.id) as { status: string };
      expect(row.status).toBe('expired');
    });
  });

  // ─── INVALID: skip when requestedQuantity > available ─

  describe('INVALID: skip when requestedQuantity exceeds available', () => {
    it('skips entry needing more tickets than available and promotes next eligible', () => {
      const user1 = seedUser();
      const user2 = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);

      // User1 wants 3 tickets, User2 wants 1
      seedWaitlistEntry(event.id, tier.id, user1.id, { requestedQuantity: 3, position: 1 });
      const entry2 = seedWaitlistEntry(event.id, tier.id, user2.id, { requestedQuantity: 1, position: 2 });

      // Only 1 ticket available
      const promoted = promoteWaitlistForTier(event.id, tier.id, 1);

      expect(promoted.length).toBe(1);
      expect(promoted[0].entryId).toBe(entry2.id);

      // User1 still queued, User2 promoted
      const row1 = db.prepare('SELECT status FROM waitlist_entries WHERE user_id = ?').get(user1.id) as { status: string };
      const row2 = db.prepare('SELECT status FROM waitlist_entries WHERE user_id = ?').get(user2.id) as { status: string };
      expect(row1.status).toBe('queued');
      expect(row2.status).toBe('notified');
    });
  });
});
