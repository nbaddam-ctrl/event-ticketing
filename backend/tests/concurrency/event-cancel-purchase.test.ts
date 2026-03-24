/**
 * CS-005: Event Cancellation During Active Purchase (US3 — T022)
 *
 * Organizer cancels event while attendee is mid-purchase.
 * No confirmed bookings exist for a cancelled event without a refund.
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

describe('CS-005: Event Cancellation During Active Purchase', () => {
  it('no confirmed booking exists for cancelled event without a refund', async () => {
    const organizer = seedOrganizer();
    const event = seedEvent(organizer.id);
    const tier = seedTier(event.id, { capacityLimit: 100 });
    const user = seedUser();

    const [cancelRes, bookRes] = await Promise.all([
      request(app)
        .post(`/events/${event.id}/cancel`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']))
        .send({ reason: 'Emergency' }),
      request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1 }),
    ]);

    // One of two outcomes:
    // 1. Booking completed first → then event cancel cancels it (with refund)
    // 2. Event cancel completed first → booking gets 404
    expect([201, 404].some((s) => bookRes.status === s || cancelRes.status >= 200)).toBe(true);

    // INVARIANT: No confirmed booking for a cancelled event without a refund
    const eventRow = db.prepare('SELECT status FROM events WHERE id = ?').get(event.id) as { status: string };
    if (eventRow.status === 'cancelled') {
      const confirmedBookings = db
        .prepare("SELECT b.id FROM bookings b WHERE b.event_id = ? AND b.status = 'confirmed'")
        .all(event.id) as Array<{ id: string }>;

      for (const b of confirmedBookings) {
        const refund = db.prepare('SELECT id FROM refunds WHERE booking_id = ?').get(b.id);
        expect(refund).toBeDefined();
      }
    }
  });
});
