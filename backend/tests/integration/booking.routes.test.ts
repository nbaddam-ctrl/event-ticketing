/**
 * Booking Routes Integration Tests (US2 — T014-T017)
 *
 * Tests the ticket purchase flow (POST /bookings):
 * - T014: Successful purchases (single, percentage discount, fixed discount)
 * - T015: Invalid purchases (sold-out, quantity validation, non-existent event, cancelled event)
 * - T016: Discount validation (multiple codes, exhausted, expired, wrong event/tier, future validFrom)
 * - T017: Auth tests (unauthenticated, verify side-effects unchanged on failure)
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

// ─── T014: Successful Purchases ──────────────────────────────

describe('Feature: Ticket Purchase — Happy Paths', () => {
  describe('Scenario: Successful single-tier purchase', () => {
    it('Given a published event, When I purchase 2 GA tickets, Then I receive 201 with confirmed booking', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { priceMinor: 5000, capacityLimit: 100 });

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('confirmed');
      expect(res.body.total_paid_minor ?? res.body.totalPaidMinor).toBeDefined();

      // Sold quantity increased
      const t = db.prepare('SELECT sold_quantity FROM ticket_tiers WHERE id = ?').get(tier.id) as { sold_quantity: number };
      expect(t.sold_quantity).toBe(2);
    });
  });

  describe('Scenario: Successful purchase with percentage discount', () => {
    it('Given a 20% discount, When I buy 3 GA tickets at $50, Then discount is $30 and total is $120', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { priceMinor: 5000, capacityLimit: 100 });
      const discount = seedDiscount({ code: 'SAVE20', type: 'percentage', value: 20 });

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 3, discountCode: 'SAVE20' });

      expect(res.status).toBe(201);
      // subtotal=15000, discount=3000, total=12000
      const booking = db.prepare('SELECT subtotal_minor, discount_amount_minor, total_paid_minor FROM bookings WHERE id = ?').get(res.body.id) as any;
      expect(booking.subtotal_minor).toBe(15000);
      expect(booking.discount_amount_minor).toBe(3000);
      expect(booking.total_paid_minor).toBe(12000);

      // Discount usedCount incremented
      const d = db.prepare('SELECT used_count FROM discount_codes WHERE id = ?').get(discount.id) as { used_count: number };
      expect(d.used_count).toBe(1);
    });
  });

  describe('Scenario: Successful purchase with fixed amount discount', () => {
    it('Given a $5 off discount, When I buy 1 VIP ticket at $150, Then total is $145', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { priceMinor: 15000, capacityLimit: 50, name: 'VIP' });
      seedDiscount({ code: 'FLAT500', type: 'fixed', value: 500 });

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1, discountCode: 'FLAT500' });

      expect(res.status).toBe(201);
      const booking = db.prepare('SELECT subtotal_minor, discount_amount_minor, total_paid_minor FROM bookings WHERE id = ?').get(res.body.id) as any;
      expect(booking.subtotal_minor).toBe(15000);
      expect(booking.discount_amount_minor).toBe(500);
      expect(booking.total_paid_minor).toBe(14500);
    });
  });
});

// ─── T015: Invalid Purchase Attempts ─────────────────────────

describe('Feature: Ticket Purchase — Invalid Attempts', () => {
  describe('Scenario: Purchase attempt for sold-out tier', () => {
    it('returns 409 with "Insufficient inventory" and soldQuantity unchanged', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { capacityLimit: 50, soldQuantity: 50 });

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1 });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Insufficient inventory');

      const t = db.prepare('SELECT sold_quantity FROM ticket_tiers WHERE id = ?').get(tier.id) as { sold_quantity: number };
      expect(t.sold_quantity).toBe(50);
    });
  });

  describe('Scenario: Purchase more tickets than available', () => {
    it('returns 409 when requesting more than remaining capacity', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { capacityLimit: 20, soldQuantity: 19 });

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 2 });

      expect(res.status).toBe(409);
    });
  });

  describe('Scenario: Purchase with zero quantity', () => {
    it('returns 400 validation error', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 0 });

      expect(res.status).toBe(400);
    });
  });

  describe('Scenario: Purchase with negative quantity', () => {
    it('returns 400 validation error', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: -1 });

      expect(res.status).toBe(400);
    });
  });

  describe('Scenario: Purchase with non-UUID tier ID', () => {
    it('returns 400 validation error', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: 'not-a-uuid', quantity: 1 });

      expect(res.status).toBe(400);
    });
  });

  describe('Scenario: Purchase for non-existent event', () => {
    it('returns 404 "Event not found"', async () => {
      const user = seedUser();
      const fakeEventId = '00000000-0000-0000-0000-000000000000';
      const fakeTierId = '00000000-0000-0000-0000-000000000001';

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: fakeEventId, ticketTierId: fakeTierId, quantity: 1 });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Event not found');
    });
  });

  describe('Scenario: Purchase for cancelled event', () => {
    it('returns 404 "Event not found" (cancelled events not visible)', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id, { status: 'cancelled' });
      const tier = seedTier(event.id);

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1 });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Event not found');
    });
  });
});

// ─── T016: Discount Validation ──────────────────────────────

describe('Feature: Ticket Purchase — Discount Validation', () => {
  describe('Scenario: Purchase with multiple discount codes', () => {
    it('returns 400 "Only one discount code is allowed per booking"', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);
      seedDiscount({ code: 'CODE1' });
      seedDiscount({ code: 'CODE2' });

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1, discountCode: 'CODE1, CODE2' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Only one discount code');
    });
  });

  describe('Scenario: Exhausted discount code', () => {
    it('returns 400 "Code usage limit reached" when usedCount >= maxUses', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);
      const discount = seedDiscount({ code: 'EXHAUSTED', maxUses: 5, usedCount: 5 });

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1, discountCode: 'EXHAUSTED' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('usage limit reached');

      // usedCount unchanged
      const d = db.prepare('SELECT used_count FROM discount_codes WHERE id = ?').get(discount.id) as { used_count: number };
      expect(d.used_count).toBe(5);
    });
  });

  describe('Scenario: Expired discount code', () => {
    it('returns 400 "Code expired"', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);
      seedDiscount({
        code: 'EXPIRED',
        validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1, discountCode: 'EXPIRED' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });
  });

  describe('Scenario: Wrong-event discount code', () => {
    it('returns 400 "Code not valid for this event"', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const eventA = seedEvent(organizer.id, { title: 'Event A' });
      const eventB = seedEvent(organizer.id, { title: 'Event B' });
      const tierB = seedTier(eventB.id);
      seedDiscount({ code: 'EVENTA', applicableEventId: eventA.id });

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: eventB.id, ticketTierId: tierB.id, quantity: 1, discountCode: 'EVENTA' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not valid for this event');
    });
  });

  describe('Scenario: Wrong-tier discount code', () => {
    it('returns 400 "Code not valid for this tier"', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tierX = seedTier(event.id, { name: 'Tier X' });
      const tierY = seedTier(event.id, { name: 'Tier Y' });
      seedDiscount({ code: 'TIERX', applicableEventId: event.id, applicableTierId: tierX.id });

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tierY.id, quantity: 1, discountCode: 'TIERX' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not valid for this tier');
    });
  });

  describe('Scenario: Future validFrom discount code', () => {
    it('returns 400 "Code not active yet"', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);
      seedDiscount({
        code: 'FUTURE',
        validFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const res = await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1, discountCode: 'FUTURE' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not active yet');
    });
  });
});

// ─── T017: Auth Tests and Side-Effect Verification ──────────

describe('Feature: Ticket Purchase — Auth & Side Effects', () => {
  describe('Scenario: Purchase without authentication', () => {
    it('returns 401', async () => {
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);

      const res = await request(app)
        .post('/bookings')
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1 });

      expect(res.status).toBe(401);
    });
  });

  describe('Side effects: soldQuantity unchanged after failed purchase', () => {
    it('soldQuantity does not change after a 409 rejection', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id, { capacityLimit: 10, soldQuantity: 10 });

      await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1 });

      const t = db.prepare('SELECT sold_quantity FROM ticket_tiers WHERE id = ?').get(tier.id) as { sold_quantity: number };
      expect(t.sold_quantity).toBe(10);
    });
  });

  describe('Side effects: usedCount unchanged after rejected discount', () => {
    it('usedCount does not change when discount code is rejected', async () => {
      const user = seedUser();
      const organizer = seedOrganizer();
      const event = seedEvent(organizer.id);
      const tier = seedTier(event.id);
      const discount = seedDiscount({ code: 'MAXED', maxUses: 3, usedCount: 3 });

      await request(app)
        .post('/bookings')
        .set('Authorization', authHeader(user.id))
        .send({ eventId: event.id, ticketTierId: tier.id, quantity: 1, discountCode: 'MAXED' });

      const d = db.prepare('SELECT used_count FROM discount_codes WHERE id = ?').get(discount.id) as { used_count: number };
      expect(d.used_count).toBe(3);
    });
  });
});
