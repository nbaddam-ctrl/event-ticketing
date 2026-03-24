/**
 * CS-001: Last-Ticket Race Condition (US3 — T018)
 *
 * 5 concurrent purchases for 1 remaining ticket.
 * Exactly 1 succeeds, 4 get 409, soldQuantity is correct.
 *
 * Note: SQLite serializes writes via its locking mechanism, so true concurrency
 * races cannot manifest. This test validates application-level correctness and
 * guards against regressions if the data store changes.
 */
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { initTestDb, clearAllTables, closeTestDb, db } from '../setup.js';
import { seedUser, seedOrganizer, seedEvent, seedTier } from '../helpers/db.js';
import { authHeader } from '../helpers/auth.js';

const app = createApp();

beforeAll(() => initTestDb());
afterAll(() => closeTestDb());
beforeEach(() => clearAllTables());

describe('CS-001: Last-Ticket Race Condition', () => {
  it('allows exactly 1 booking when 5 users race for the last ticket', async () => {
    const organizer = seedOrganizer();
    const event = seedEvent(organizer.id);
    const tier = seedTier(event.id, { capacityLimit: 50, soldQuantity: 49 });

    const users = Array.from({ length: 5 }, () => seedUser());

    const promises = users.map((user) =>
      request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1 }),
    );

    const results = await Promise.all(promises);

    const successes = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);

    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(4);

    // Verify final soldQuantity
    const t = db.prepare('SELECT sold_quantity FROM ticket_tiers WHERE id = ?').get(tier.id) as { sold_quantity: number };
    expect(t.sold_quantity).toBe(50);

    // Verify exactly 1 booking record
    const bookings = db.prepare('SELECT COUNT(*) as c FROM bookings WHERE event_id = ?').get(event.id) as { c: number };
    expect(bookings.c).toBe(1);
  });
});
