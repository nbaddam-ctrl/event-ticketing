/**
 * CS-006: Waitlist Promotion During Cancellation Cascade (US3 — T023)
 *
 * Event cancellation triggers mass booking cancellations.
 * Waitlist promotions should NOT fire for a cancelled event.
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

describe('CS-006: Waitlist Promotion During Cancellation Cascade', () => {
  it('event cancellation does not promote waitlist entries', async () => {
    const organizer = seedOrganizer();
    const event = seedEvent(organizer.id);
    const tier = seedTier(event.id, { capacityLimit: 10, soldQuantity: 10 });

    // Create 10 confirmed bookings
    const attendees: Array<{ id: string }> = [];
    for (let i = 0; i < 10; i++) {
      const user = seedUser();
      attendees.push(user);
      seedBooking(user.id, event.id, tier.id, { quantity: 1, totalPaidMinor: 5000 });
    }

    // Create 5 waitlist entries
    const waitlistUsers: Array<{ id: string }> = [];
    for (let i = 0; i < 5; i++) {
      const user = seedUser();
      waitlistUsers.push(user);
      seedWaitlistEntry(event.id, tier.id, user.id, {
        requestedQuantity: 1,
        position: i + 1,
      });
    }

    // Cancel the event
    const res = await request(app)
      .post(`/events/${event.id}/cancel`)
      .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']))
      .send({ reason: 'Force majeure' });

    expect(res.status).toBe(202);
    expect(res.body.refundCount).toBe(10);

    // All bookings should be cancelled
    const bookings = db.prepare("SELECT status FROM bookings WHERE event_id = ?").all(event.id) as Array<{ status: string }>;
    expect(bookings.every((b) => b.status === 'cancelled')).toBe(true);

    // 10 refunds created
    const refunds = db.prepare('SELECT COUNT(*) as c FROM refunds').get() as { c: number };
    expect(refunds.c).toBe(10);

    // INVARIANT: No waitlist entries should be promoted for a cancelled event
    const promotedEntries = db
      .prepare("SELECT COUNT(*) as c FROM waitlist_entries WHERE event_id = ? AND status = 'notified'")
      .get(event.id) as { c: number };
    expect(promotedEntries.c).toBe(0);
  });
});
