/**
 * Ticket Tier State Transition Tests (US1 — T010)
 *
 * Validates every valid and invalid state transition for TicketTier entity:
 * - (new) → active via event creation or addTierToEvent()
 * - active → inactive via deactivateTier() with zero sales
 * - inactive → active via syncEventTiers()
 * - INVALID: deactivate with sold tickets
 * - INVALID: deactivate last remaining tier
 */
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { initTestDb, clearAllTables, closeTestDb, db } from '../setup.js';
import { seedOrganizer, seedEvent, seedTier } from '../helpers/db.js';
import { authHeader } from '../helpers/auth.js';

const app = createApp();

beforeAll(() => initTestDb());
afterAll(() => closeTestDb());
beforeEach(() => clearAllTables());

describe('Ticket Tier State Transitions', () => {
  // ─── (new) → active ────────────────────────────────

  describe('(new) → active', () => {
    it('creates tier with active status when event is created', async () => {
      const organizer = seedOrganizer();

      const res = await request(app)
        .post('/events')
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']))
        .send({
          title: 'Tier Test Event',
          venueName: 'Venue',
          startAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          timezone: 'UTC',
          tiers: [{ name: 'GA', priceMinor: 5000, currency: 'USD', capacityLimit: 100 }],
        });

      const tiers = db.prepare("SELECT status FROM ticket_tiers WHERE event_id = ?").all(res.body.id) as Array<{ status: string }>;
      expect(tiers[0].status).toBe('active');
    });

    it('creates tier with active status when added to existing event', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      seedTier(event.id);

      const res = await request(app)
        .post(`/events/${event.id}/tiers`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']))
        .send({ name: 'VIP', priceMinor: 15000, currency: 'USD', capacityLimit: 20 });

      expect(res.status).toBe(201);
      const tier = db.prepare("SELECT status FROM ticket_tiers WHERE event_id = ? AND name = 'VIP'").get(event.id) as { status: string };
      expect(tier.status).toBe('active');
    });
  });

  // ─── active → inactive ─────────────────────────────

  describe('active → inactive', () => {
    it('deactivates tier with zero sales via DELETE /events/:id/tiers/:tierId', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier1 = seedTier(event.id, { name: 'GA' });
      const tier2 = seedTier(event.id, { name: 'VIP' });

      const res = await request(app)
        .delete(`/events/${event.id}/tiers/${tier2.id}`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('inactive');

      const row = db.prepare('SELECT status FROM ticket_tiers WHERE id = ?').get(tier2.id) as { status: string };
      expect(row.status).toBe('inactive');
    });
  });

  // ─── inactive → active (via syncEventTiers) ────────

  describe('inactive → active (via syncEventTiers)', () => {
    it('reactivates inactive tier when synced with matching name', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      seedTier(event.id, { name: 'GA', status: 'active' });
      const inactiveTier = seedTier(event.id, { name: 'VIP', status: 'inactive', priceMinor: 15000 });

      const res = await request(app)
        .put(`/events/${event.id}/tiers`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']))
        .send({
          tiers: [
            { name: 'GA', priceMinor: 5000, currency: 'USD', capacityLimit: 100 },
            { name: 'VIP', priceMinor: 15000, currency: 'USD', capacityLimit: 50 },
          ],
        });

      expect(res.status).toBe(200);
      const row = db.prepare('SELECT status FROM ticket_tiers WHERE id = ?').get(inactiveTier.id) as { status: string };
      expect(row.status).toBe('active');
    });
  });

  // ─── INVALID transitions ───────────────────────────

  describe('INVALID: deactivate tier with sold tickets', () => {
    it('returns 400 when deactivating tier with non-zero sold quantity', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      seedTier(event.id, { name: 'GA' });
      const soldTier = seedTier(event.id, { name: 'VIP', soldQuantity: 5 });

      const res = await request(app)
        .delete(`/events/${event.id}/tiers/${soldTier.id}`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']));

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('existing bookings or reservations');

      // Verify tier is still active
      const row = db.prepare('SELECT status FROM ticket_tiers WHERE id = ?').get(soldTier.id) as { status: string };
      expect(row.status).toBe('active');
    });
  });

  describe('INVALID: deactivate last remaining tier', () => {
    it('returns 400 when trying to deactivate the only active tier', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const onlyTier = seedTier(event.id, { name: 'GA' });

      const res = await request(app)
        .delete(`/events/${event.id}/tiers/${onlyTier.id}`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']));

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('last remaining tier');
    });
  });
});
