/**
 * CS-003: Discount Code Exhaustion Race (US3 — T020)
 *
 * 2 concurrent bookings with a discount code that has 1 remaining use.
 * At most 1 booking gets the discount, usedCount never exceeds maxUses.
 *
 * Known Risk: incrementDiscountUsage() is called outside the booking transaction.
 * Under SQLite's serialized writes this works, but would be vulnerable in a
 * multi-process or distributed deployment.
 */
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { initTestDb, clearAllTables, closeTestDb, db } from '../setup.js';
import { seedUser, seedOrganizer, seedEvent, seedTier, seedDiscount } from '../helpers/db.js';
import { authHeader } from '../helpers/auth.js';

const app = createApp();

beforeAll(() => initTestDb());
afterAll(() => closeTestDb());
beforeEach(() => clearAllTables());

describe('CS-003: Discount Code Exhaustion Race', () => {
  it('at most 1 booking applies the discount when 2 users race for the last use', async () => {
    const organizer = seedOrganizer();
    const event = seedEvent(organizer.id);
    const tier = seedTier(event.id, { priceMinor: 5000, capacityLimit: 100 });
    const discount = seedDiscount({ code: 'LASTUSE', maxUses: 5, usedCount: 4 });

    const user1 = seedUser();
    const user2 = seedUser();

    const [res1, res2] = await Promise.all([
      request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user1.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1, discountCode: 'LASTUSE' }),
      request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user2.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1, discountCode: 'LASTUSE' }),
    ]);

    // Both may succeed (one with discount, one without) or one may get 400
    const successes = [res1, res2].filter((r) => r.status === 201);
    expect(successes.length).toBeGreaterThanOrEqual(1);

    // usedCount must never exceed maxUses
    const d = db.prepare('SELECT used_count, max_uses FROM discount_codes WHERE id = ?').get(discount.id) as { used_count: number; max_uses: number };
    expect(d.used_count).toBeLessThanOrEqual(d.max_uses);
  });
});
