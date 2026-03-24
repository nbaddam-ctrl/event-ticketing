/**
 * CS-004: Waitlist Position Assignment Race (US3 — T021)
 *
 * 5 concurrent waitlist joins for the same tier.
 * All 5 entries created with unique sequential positions.
 *
 * Known Risk: createWaitlistEntry() reads MAX(position) + 1 and inserts in
 * a non-transactional pattern. Under SQLite's serialized writes this works,
 * but would be vulnerable in a multi-process deployment.
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

describe('CS-004: Waitlist Position Assignment Race', () => {
  it('assigns unique sequential positions when 5 users join simultaneously', async () => {
    const organizer = seedOrganizer();
    const event = seedEvent(organizer.id);
    const tier = seedTier(event.id, { capacityLimit: 10, soldQuantity: 10 });

    const users = Array.from({ length: 5 }, () => seedUser());

    const promises = users.map((user) =>
      request(app)
        .post('/waitlist')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, requestedQuantity: 1 }),
    );

    const results = await Promise.all(promises);

    // All should succeed
    expect(results.every((r) => r.status === 201)).toBe(true);

    // Verify unique positions in database
    const entries = db
      .prepare('SELECT position FROM waitlist_entries WHERE event_id = ? AND ticket_tier_id = ? ORDER BY position')
      .all(event.id, tier.id) as Array<{ position: number }>;

    expect(entries.length).toBe(5);

    const positions = entries.map((e) => e.position);
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBe(5);

    // Positions should be sequential (1, 2, 3, 4, 5)
    expect(positions).toEqual([1, 2, 3, 4, 5]);
  });
});
