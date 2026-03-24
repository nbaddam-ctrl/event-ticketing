/**
 * CS-002: Cancel-Then-Rebook Race (US3 — T019)
 *
 * User A cancels the last ticket while User B simultaneously tries to purchase.
 * soldQuantity never goes negative, final state is consistent.
 */
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { initTestDb, clearAllTables, closeTestDb, db } from '../setup.js';
import { seedUser, seedOrganizer, seedEvent, seedTier, seedBooking } from '../helpers/db.js';
import { authHeader } from '../helpers/auth.js';

const app = createApp();

beforeAll(() => initTestDb());
afterAll(() => closeTestDb());
beforeEach(() => clearAllTables());

describe('CS-002: Cancel-Then-Rebook Race', () => {
  it('soldQuantity never goes negative when cancel and purchase happen concurrently', async () => {
    const organizer = seedOrganizer();
    const event = seedEvent(organizer.id);
    const tier = seedTier(event.id, { capacityLimit: 1, soldQuantity: 1 });
    const userA = seedUser();
    const userB = seedUser();
    const booking = seedBooking(userA.id, event.id, tier.id, { quantity: 1, totalPaidMinor: 5000 });

    const [cancelRes, purchaseRes] = await Promise.all([
      request(app)
        .post(`/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(userA.id)),
      request(app)
        .post('/bookings')
        .set('Authorization', authHeader(userB.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1 }),
    ]);

    // Cancel should always succeed
    expect(cancelRes.status).toBe(200);

    // Purchase either succeeds (201) or fails (409)
    expect([201, 409]).toContain(purchaseRes.status);

    // soldQuantity must never be negative
    const t = db.prepare('SELECT sold_quantity FROM ticket_tiers WHERE id = ?').get(tier.id) as { sold_quantity: number };
    expect(t.sold_quantity).toBeGreaterThanOrEqual(0);
    expect(t.sold_quantity).toBeLessThanOrEqual(1);
  });
});
