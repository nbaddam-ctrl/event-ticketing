/**
 * Organizer Approval State Transition Tests (US1 — T013)
 *
 * Validates organizer approval lifecycle:
 * - none → pending via requestOrganizerRole()
 * - pending → approved via admin decision
 * - pending → rejected via admin decision
 * - INVALID: non-approved organizer creates event
 */
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { initTestDb, clearAllTables, closeTestDb, db } from '../setup.js';
import { seedUser, seedAdmin, seedOrganizer } from '../helpers/db.js';
import { authHeader } from '../helpers/auth.js';

const app = createApp();

beforeAll(() => initTestDb());
afterAll(() => closeTestDb());
beforeEach(() => clearAllTables());

describe('Organizer Approval State Transitions', () => {
  // ─── none → pending ────────────────────────────────

  describe('none → pending', () => {
    it('creates organizer request with pending status', async () => {
      const user = seedUser();

      const res = await request(app)
        .post('/organizer/requests')
        .set('Authorization', authHeader(user.id));

      expect(res.status).toBe(202);
      expect(res.body.status).toBe('pending');

      const userRow = db.prepare('SELECT organizer_approval_status FROM users WHERE id = ?').get(user.id) as { organizer_approval_status: string };
      expect(userRow.organizer_approval_status).toBe('pending');
    });

    it('returns existing pending request if one already exists', async () => {
      const user = seedUser();

      const res1 = await request(app)
        .post('/organizer/requests')
        .set('Authorization', authHeader(user.id));

      const res2 = await request(app)
        .post('/organizer/requests')
        .set('Authorization', authHeader(user.id));

      expect(res1.body.requestId).toBe(res2.body.requestId);
    });
  });

  // ─── pending → approved ────────────────────────────

  describe('pending → approved', () => {
    it('approves organizer request and grants organizer role', async () => {
      const admin = seedAdmin();
      const user = seedUser({ organizerApprovalStatus: 'pending' });

      // Create a pending request
      const requestId = db.prepare(
        "INSERT INTO organizer_requests (id, user_id, status, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?) RETURNING id"
      ).get(
        require('node:crypto').randomUUID(), user.id, new Date().toISOString(), new Date().toISOString()
      ) as { id: string };

      const res = await request(app)
        .post(`/admin/organizer-requests/${requestId.id}/decision`)
        .set('Authorization', authHeader(admin.id, ['admin']))
        .send({ decision: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');

      const userRow = db.prepare('SELECT roles, organizer_approval_status FROM users WHERE id = ?').get(user.id) as { roles: string; organizer_approval_status: string };
      expect(userRow.organizer_approval_status).toBe('approved');
      expect(userRow.roles).toContain('organizer');
    });

    it('sends organizer_request_approved notification', async () => {
      const admin = seedAdmin();
      const user = seedUser({ organizerApprovalStatus: 'pending' });

      const requestId = db.prepare(
        "INSERT INTO organizer_requests (id, user_id, status, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?) RETURNING id"
      ).get(
        require('node:crypto').randomUUID(), user.id, new Date().toISOString(), new Date().toISOString()
      ) as { id: string };

      await request(app)
        .post(`/admin/organizer-requests/${requestId.id}/decision`)
        .set('Authorization', authHeader(admin.id, ['admin']))
        .send({ decision: 'approved' });

      const notification = db.prepare(
        "SELECT type FROM notifications WHERE user_id = ? AND type = 'organizer_request_approved'"
      ).get(user.id) as { type: string } | undefined;
      expect(notification).toBeDefined();
    });
  });

  // ─── pending → rejected ────────────────────────────

  describe('pending → rejected', () => {
    it('rejects organizer request and sets rejection status', async () => {
      const admin = seedAdmin();
      const user = seedUser({ organizerApprovalStatus: 'pending' });

      const requestId = db.prepare(
        "INSERT INTO organizer_requests (id, user_id, status, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?) RETURNING id"
      ).get(
        require('node:crypto').randomUUID(), user.id, new Date().toISOString(), new Date().toISOString()
      ) as { id: string };

      const res = await request(app)
        .post(`/admin/organizer-requests/${requestId.id}/decision`)
        .set('Authorization', authHeader(admin.id, ['admin']))
        .send({ decision: 'rejected', reason: 'Insufficient experience' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('rejected');

      const userRow = db.prepare('SELECT organizer_approval_status FROM users WHERE id = ?').get(user.id) as { organizer_approval_status: string };
      expect(userRow.organizer_approval_status).toBe('rejected');
    });
  });

  // ─── INVALID: non-approved organizer creates event ──

  describe('INVALID: non-approved organizer creates event', () => {
    it('returns 403 when non-approved user tries to create event', async () => {
      const user = seedUser(); // roles: 'attendee', approvalStatus: 'none'

      const res = await request(app)
        .post('/events')
        .set('Authorization', authHeader(user.id, ['attendee']))
        .send({
          title: 'Blocked Event',
          venueName: 'Nowhere',
          startAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          timezone: 'UTC',
          tiers: [{ name: 'GA', priceMinor: 5000, currency: 'USD', capacityLimit: 100 }],
        });

      expect(res.status).toBe(403);
    });

    it('returns 403 when pending organizer tries to create event', async () => {
      const user = seedUser({ organizerApprovalStatus: 'pending' });

      const res = await request(app)
        .post('/events')
        .set('Authorization', authHeader(user.id, ['attendee']))
        .send({
          title: 'Blocked Event',
          venueName: 'Nowhere',
          startAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          timezone: 'UTC',
          tiers: [{ name: 'GA', priceMinor: 5000, currency: 'USD', capacityLimit: 100 }],
        });

      expect(res.status).toBe(403);
    });

    it('returns 403 when rejected organizer tries to create event', async () => {
      const user = seedUser({ organizerApprovalStatus: 'rejected', roles: 'attendee' });

      const res = await request(app)
        .post('/events')
        .set('Authorization', authHeader(user.id, ['attendee']))
        .send({
          title: 'Blocked Event',
          venueName: 'Nowhere',
          startAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          timezone: 'UTC',
          tiers: [{ name: 'GA', priceMinor: 5000, currency: 'USD', capacityLimit: 100 }],
        });

      expect(res.status).toBe(403);
    });
  });
});
