/**
 * Event Tier Management Acceptance Tests (US4 — T026)
 *
 * Gherkin-style acceptance tests for:
 * - Create event with multiple tiers
 * - Add tier to existing event
 * - Update tier price
 * - Deactivate tier with zero sales
 * - INVALID: Deactivate with sold tickets
 * - INVALID: Reduce capacity below sold count
 * - INVALID: Manage cancelled event tiers
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

describe('Feature: Event Tier Management', () => {
  describe('Scenario: Create event with multiple tiers', () => {
    it('Given I am an approved organizer, When I create an event with 3 tiers, Then all 3 tiers are created as active', async () => {
      const organizer = seedOrganizer();

      const res = await request(app)
        .post('/events')
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']))
        .send({
          title: 'Multi-Tier Concert',
          venueName: 'Arena',
          startAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          timezone: 'UTC',
          tiers: [
            { name: 'Early Bird', priceMinor: 3500, currency: 'USD', capacityLimit: 100 },
            { name: 'General Admission', priceMinor: 5000, currency: 'USD', capacityLimit: 200 },
            { name: 'VIP', priceMinor: 15000, currency: 'USD', capacityLimit: 50 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('published');

      const tiers = db.prepare("SELECT name, status FROM ticket_tiers WHERE event_id = ? ORDER BY price_minor ASC").all(res.body.id) as Array<{ name: string; status: string }>;
      expect(tiers.length).toBe(3);
      expect(tiers.every((t) => t.status === 'active')).toBe(true);
      expect(tiers.map((t) => t.name)).toEqual(['Early Bird', 'General Admission', 'VIP']);
    });
  });

  describe('Scenario: Add tier to existing event', () => {
    it('Given I have a published event with 1 tier, When I add a VIP tier, Then event has 2 active tiers', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      seedTier(event.id, { name: 'GA' });

      const res = await request(app)
        .post(`/events/${event.id}/tiers`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']))
        .send({ name: 'VIP', priceMinor: 20000, currency: 'USD', capacityLimit: 30 });

      expect(res.status).toBe(201);

      const tiers = db.prepare("SELECT name FROM ticket_tiers WHERE event_id = ? AND status = 'active'").all(event.id);
      expect(tiers.length).toBe(2);
    });
  });

  describe('Scenario: Update tier price', () => {
    it('Given a Standard tier, When I update its price to $60, Then the tier price is updated', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { name: 'Standard', priceMinor: 5000 });

      const res = await request(app)
        .patch(`/events/${event.id}/tiers/${tier.id}`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']))
        .send({ priceMinor: 6000 });

      expect(res.status).toBe(200);

      const row = db.prepare('SELECT price_minor FROM ticket_tiers WHERE id = ?').get(tier.id) as { price_minor: number };
      expect(row.price_minor).toBe(6000);
    });
  });

  describe('Scenario: Deactivate tier with zero sales', () => {
    it('Given 2 active tiers and Early Bird has 0 sales, When I deactivate Early Bird, Then it becomes inactive', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      seedTier(event.id, { name: 'GA' });
      const earlyBird = seedTier(event.id, { name: 'Early Bird', soldQuantity: 0 });

      const res = await request(app)
        .delete(`/events/${event.id}/tiers/${earlyBird.id}`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('inactive');

      // Still has 1 active tier
      const activeTiers = db.prepare("SELECT COUNT(*) as c FROM ticket_tiers WHERE event_id = ? AND status = 'active'").get(event.id) as { c: number };
      expect(activeTiers.c).toBe(1);
    });
  });

  describe('Scenario: Attempt to deactivate tier with sold tickets', () => {
    it('returns 400 and tier remains active', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      seedTier(event.id, { name: 'GA' });
      const soldTier = seedTier(event.id, { name: 'Standard', soldQuantity: 5 });

      const res = await request(app)
        .delete(`/events/${event.id}/tiers/${soldTier.id}`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']));

      expect(res.status).toBe(400);

      const row = db.prepare('SELECT status FROM ticket_tiers WHERE id = ?').get(soldTier.id) as { status: string };
      expect(row.status).toBe('active');
    });
  });

  describe('Scenario: Attempt to reduce capacity below sold count', () => {
    it('returns 400 when capacity is set below sold+reserved', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { capacityLimit: 100, soldQuantity: 60 });

      const res = await request(app)
        .patch(`/events/${event.id}/tiers/${tier.id}`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']))
        .send({ capacityLimit: 50 });

      expect(res.status).toBe(400);

      const row = db.prepare('SELECT capacity_limit FROM ticket_tiers WHERE id = ?').get(tier.id) as { capacity_limit: number };
      expect(row.capacity_limit).toBe(100);
    });
  });

  describe('Scenario: Attempt to manage tiers on cancelled event', () => {
    it('returns 400 "Cannot modify tiers for a cancelled event"', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id, { status: 'cancelled' });
      seedTier(event.id, { name: 'GA' });

      const res = await request(app)
        .post(`/events/${event.id}/tiers`)
        .set('Authorization', authHeader(organizer.id, ['attendee', 'organizer']))
        .send({ name: 'VIP', priceMinor: 15000, currency: 'USD', capacityLimit: 20 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot modify tiers for a cancelled event');
    });
  });
});
