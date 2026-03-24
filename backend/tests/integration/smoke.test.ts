/**
 * Smoke test — verifies the test infrastructure works end-to-end:
 * in-memory DB, schema loading, app creation, and supertest requests.
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

describe('Smoke Test', () => {
  it('GET /health returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('in-memory database has schema tables', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as Array<{ name: string }>;
    const names = tables.map((t) => t.name);
    expect(names).toContain('users');
    expect(names).toContain('events');
    expect(names).toContain('bookings');
    expect(names).toContain('ticket_tiers');
    expect(names).toContain('waitlist_entries');
    expect(names).toContain('refunds');
    expect(names).toContain('notifications');
  });

  it('seed helpers create data and clearAllTables removes it', () => {
    const organizer = seedOrganizer();
    const event = seedEvent(organizer.id);
    seedTier(event.id);

    const before = db.prepare('SELECT COUNT(*) as c FROM events').get() as { c: number };
    expect(before.c).toBe(1);

    clearAllTables();

    const after = db.prepare('SELECT COUNT(*) as c FROM events').get() as { c: number };
    expect(after.c).toBe(0);
  });

  it('auth helper produces valid JWT accepted by middleware', async () => {
    const user = seedUser();
    const header = authHeader(user.id);

    const res = await request(app)
      .get('/bookings')
      .set('Authorization', header);

    // Should not be 401 — the token is valid
    expect(res.status).not.toBe(401);
  });

  it('unauthenticated request returns 401', async () => {
    const res = await request(app).get('/bookings');
    expect(res.status).toBe(401);
  });
});
